<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportController extends Controller
{
    private const STATUSES = ['todo', 'in_progress', 'under_review', 'done', 'blocked'];

    private const STATUS_LABEL = [
        'todo'         => 'To Do',
        'in_progress'  => 'In Progress',
        'under_review' => 'Under Review',
        'done'         => 'Done',
        'blocked'      => 'Blocked',
    ];

    /** Per-employee task counters + completion percentage. */
    public function employees(): InertiaResponse
    {
        $this->authorize('permission', 'reports.view');

        $users = User::active()
            ->with('designation:id,name')
            ->withCount([
                'tasks as tasks_total',
                'tasks as todo_count'         => fn ($q) => $q->where('tasks.status', 'todo'),
                'tasks as in_progress_count'  => fn ($q) => $q->where('tasks.status', 'in_progress'),
                'tasks as under_review_count' => fn ($q) => $q->where('tasks.status', 'under_review'),
                'tasks as done_count'         => fn ($q) => $q->where('tasks.status', 'done'),
                'tasks as blocked_count'      => fn ($q) => $q->where('tasks.status', 'blocked'),
            ])
            ->addSelect(['created_count' => Task::selectRaw('count(*)')->whereColumn('reporter_id', 'users.id')])
            ->orderBy('name')
            ->get();

        $rows = $users->map(fn (User $u) => [
            'id'           => $u->id,
            'name'         => $u->name,
            'employee_id'  => $u->employee_id,
            'designation'  => $u->designation?->name,
            'created'      => (int) $u->created_count,
            'total'        => (int) $u->tasks_total,
            'todo'         => (int) $u->todo_count,
            'in_progress'  => (int) $u->in_progress_count,
            'under_review' => (int) $u->under_review_count,
            'done'         => (int) $u->done_count,
            'blocked'      => (int) $u->blocked_count,
            'done_pct'     => $u->tasks_total > 0 ? (int) round($u->done_count / $u->tasks_total * 100) : 0,
        ]);

        return Inertia::render('Reports/Employees', [
            'rows'    => $rows,
            'totals'  => [
                'employees' => $rows->count(),
                'tasks'     => (int) $rows->sum('total'),
                'done'      => (int) $rows->sum('done'),
            ],
        ]);
    }

    /** Filterable task list (employee optional + status optional) with Excel export. */
    public function tasks(Request $request): InertiaResponse
    {
        $this->authorize('permission', 'reports.view');

        $filters = $request->validate([
            'employee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status'      => ['nullable', 'in:'.implode(',', self::STATUSES)],
        ]);

        return Inertia::render('Reports/Tasks', [
            'users'   => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'filters' => [
                'employee_id' => $filters['employee_id'] ?? null,
                'status'      => $filters['status'] ?? null,
            ],
            'rows'    => $this->taskRows($filters),
        ]);
    }

    /** Download the filtered task list as an Excel (.xls) file. */
    public function export(Request $request): Response
    {
        $this->authorize('permission', 'reports.view');

        $filters = $request->validate([
            'employee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status'      => ['nullable', 'in:'.implode(',', self::STATUSES)],
        ]);

        $rows     = $this->taskRows($filters);
        $employee = ! empty($filters['employee_id']) ? User::find($filters['employee_id'])?->name : 'All employees';
        $status   = ! empty($filters['status']) ? self::STATUS_LABEL[$filters['status']] : 'All statuses';

        $html = view('reports.tasks-xls', [
            'rows'     => $rows,
            'employee' => $employee,
            'status'   => $status,
            'labels'   => self::STATUS_LABEL,
        ])->render();

        $filename = 'task-report-'.now()->format('Ymd-His').'.xls';

        return response($html, 200, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /** Shared query for the task report list + export. */
    private function taskRows(array $filters)
    {
        return Task::query()
            ->with(['project:id,name', 'assignees:id,name'])
            ->when(! empty($filters['employee_id']), fn ($q) => $q->whereHas('assignees', fn ($a) => $a->where('users.id', $filters['employee_id'])))
            ->when(! empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Task $t) => [
                'task_no'   => $t->task_no,
                'title'     => $t->title,
                'project'   => $t->project?->name,
                'assignees' => $t->assignees->pluck('name')->implode(', '),
                'priority'  => $t->priority,
                'status'    => $t->status,
                'status_label' => self::STATUS_LABEL[$t->status] ?? $t->status,
                'due_date'  => $t->due_date?->toDateString(),
            ]);
    }
}
