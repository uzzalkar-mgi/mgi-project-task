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

        // My tasks list (open), soonest due first.
        $myTaskList = (clone $myTasks)
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

        // Project health (RAG) — % done per visible project.
        $health = Project::whereIn('id', $projectIds)
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

        // Status breakdown across visible projects (for a future chart / summary).
        $statusBreakdown = Task::whereIn('project_id', $projectIds)
            ->selectRaw('status, count(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        // Project-wise task status counts (for the bar chart).
        $statuses = ['todo', 'in_progress', 'under_review', 'done', 'blocked'];
        $projectStatus = Project::whereIn('id', $projectIds)
            ->withCount(collect($statuses)->mapWithKeys(fn ($s) => [
                "tasks as {$s}_count" => fn ($q) => $q->where('status', $s),
            ])->all())
            ->orderBy('name')
            ->get()
            ->map(fn (Project $p) => [
                'uuid'    => $p->uuid,
                'name'    => $p->name,
                'counts'  => [
                    'todo'         => $p->todo_count,
                    'in_progress'  => $p->in_progress_count,
                    'under_review' => $p->under_review_count,
                    'done'         => $p->done_count,
                    'blocked'      => $p->blocked_count,
                ],
                'total'   => $p->todo_count + $p->in_progress_count + $p->under_review_count + $p->done_count + $p->blocked_count,
            ]);

        return Inertia::render('Dashboard', [
            'stats'           => $stats,
            'myTasks'         => $myTaskList,
            'health'          => $health,
            'statusBreakdown' => $statusBreakdown,
            'projectStatus'   => $projectStatus,
        ]);
    }
}
