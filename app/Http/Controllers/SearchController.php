<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /** Global search across tasks, projects, people & meetings (respects visibility). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $q = trim((string) $request->get('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['tasks' => [], 'projects' => [], 'users' => [], 'meetings' => []]);
        }

        $like = '%'.$q.'%';
        $projectIds = Project::query()->visibleTo($user)->pluck('id');

        // Tasks: in a visible project OR assigned to the user (super/admin see all).
        $canAllTasks = $user->isSuperAdmin() || $user->hasRole('admin');
        $tasks = Task::query()
            ->where(fn ($w) => $w->where('title', 'ilike', $like)->orWhere('task_no', 'ilike', $like))
            ->when(! $canAllTasks, fn ($w) => $w->where(fn ($x) => $x->whereIn('project_id', $projectIds)
                ->orWhereHas('assignees', fn ($a) => $a->where('users.id', $user->id))))
            ->with('project:id,name')
            ->orderByDesc('id')
            ->limit(6)
            ->get(['uuid', 'title', 'task_no', 'status', 'project_id'])
            ->map(fn (Task $t) => [
                'uuid' => $t->uuid, 'title' => $t->title, 'task_no' => $t->task_no,
                'status' => $t->status, 'project' => $t->project?->name,
            ]);

        $projects = Project::query()->visibleTo($user)
            ->where('name', 'ilike', $like)
            ->orderBy('name')
            ->limit(6)
            ->get(['uuid', 'name', 'status'])
            ->map(fn (Project $p) => ['uuid' => $p->uuid, 'name' => $p->name, 'status' => $p->status]);

        $users = [];
        if ($user->hasPermission('users.menu')) {
            $users = User::active()
                ->where(fn ($w) => $w->where('name', 'ilike', $like)->orWhere('employee_id', 'ilike', $like))
                ->orderBy('name')
                ->limit(6)
                ->get(['uuid', 'name', 'employee_id'])
                ->map(fn (User $u) => ['uuid' => $u->uuid, 'name' => $u->name, 'employee_id' => $u->employee_id]);
        }

        $meetings = [];
        if ($user->hasPermission('meetings.view')) {
            $meetings = Meeting::where('title', 'ilike', $like)
                ->orderByDesc('meeting_date')
                ->limit(6)
                ->get(['uuid', 'title', 'meeting_date'])
                ->map(fn (Meeting $m) => ['uuid' => $m->uuid, 'title' => $m->title, 'date' => $m->meeting_date?->toDateString()]);
        }

        return response()->json(compact('tasks', 'projects', 'users', 'meetings'));
    }
}
