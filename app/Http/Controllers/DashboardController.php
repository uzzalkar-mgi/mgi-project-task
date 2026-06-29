<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user    = $request->user();
        $today   = Carbon::today();
        $monthStart = Carbon::today()->startOfMonth();

        // Projects visible to this user (membership-based; super-admin = all).
        $projectScope = Project::query()->visibleTo($user);
        $projectIds = (clone $projectScope)->pluck('id');

        // My tasks = tasks assigned to me.
        $myTasks = Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id));

        $stats = [
            'active_projects' => (clone $projectScope)->where('status', 'active')->count(),
            'my_tasks'        => (clone $myTasks)->whereNotIn('status', ['done'])->count(),
            'overdue'         => (clone $myTasks)->where('due_date', '<', $today)->whereNotIn('status', ['done'])->count(),
            'completed_month' => (clone $myTasks)->where('status', 'done')->where('updated_at', '>=', $monthStart)->count(),
        ];

        // The stat cards above are cheap (indexed counts) and render immediately.
        // Everything below is deferred — the page shell loads instantly and these
        // stream in after, each with its own loader. Keeps the dashboard fast as
        // task volume grows.

        $myTasksDeferred = fn () => (clone $myTasks)
            ->whereNotIn('status', ['done'])
            ->with('project:id,uuid,name')
            ->orderByRaw('due_date is null, due_date asc')
            ->limit(8)
            ->get()
            ->map(fn (Task $t) => [
                'uuid'     => $t->uuid,
                'title'    => $t->title,
                'project'  => $t->project?->name,
                'status'   => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date?->toDateString(),
                'overdue'  => $t->due_date && $t->due_date->lt($today) && $t->status !== 'done',
            ]);

        $healthDeferred = fn () => Project::whereIn('id', $projectIds)
            ->withCount([
                'tasks',
                'tasks as done_count' => fn ($q) => $q->where('status', 'done'),
                'tasks as overdue_count' => fn ($q) => $q->where('due_date', '<', $today)->whereNotIn('status', ['done']),
            ])
            ->where('status', 'active')
            ->get()
            ->map(function (Project $p) {
                $pct = $p->tasks_count > 0 ? (int) round($p->done_count / $p->tasks_count * 100) : 0;
                $rag = $p->overdue_count > 0 ? 'red' : ($pct >= 70 ? 'green' : 'amber');

                return [
                    'uuid'     => $p->uuid,
                    'name'     => $p->name,
                    'progress' => $pct,
                    'rag'      => $rag,
                    'overdue'  => $p->overdue_count,
                ];
            });

        // Project-wise status counts — ONE grouped query (cheap at scale) instead of
        // 5 subqueries per project.
        $projectStatusDeferred = function () use ($projectIds) {
            $counts = Task::whereIn('project_id', $projectIds)
                ->selectRaw('project_id, status, count(*) as c')
                ->groupBy('project_id', 'status')
                ->get()
                ->groupBy('project_id');

            return Project::whereIn('id', $projectIds)->orderBy('name')->get(['id', 'uuid', 'name'])
                ->map(function (Project $p) use ($counts) {
                    $byStatus = ($counts[$p->id] ?? collect())->pluck('c', 'status');
                    $c = fn ($s) => (int) ($byStatus[$s] ?? 0);
                    $total = $byStatus->sum();

                    return [
                        'uuid'   => $p->uuid,
                        'name'   => $p->name,
                        'counts' => [
                            'todo' => $c('todo'), 'in_progress' => $c('in_progress'),
                            'under_review' => $c('under_review'), 'done' => $c('done'), 'blocked' => $c('blocked'),
                        ],
                        'total'  => $total,
                    ];
                })
                ->filter(fn ($p) => $p['total'] > 0)
                ->values();
        };

        return Inertia::render('Dashboard', [
            'stats'         => $stats,
            'myTasks'       => Inertia::defer($myTasksDeferred),
            'health'        => Inertia::defer($healthDeferred),
            'projectStatus' => Inertia::defer($projectStatusDeferred),
        ]);
    }
}
