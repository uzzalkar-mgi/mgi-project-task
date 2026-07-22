<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /** Projects this user is allowed to see / attach tasks to. */
    private function visibleProjects(User $user)
    {
        return Project::query()->visibleTo($user)->orderBy('name');
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $projectIds = $this->visibleProjects($user)->pluck('id');

        $tasks = Task::whereIn('project_id', $projectIds)
            ->with(['project:id,uuid,name', 'assignees:id,name'])
            ->withCount('attachments', 'comments')
            ->orderByRaw('due_date is null, due_date asc')
            ->get();

        // Per-user last-viewed timestamps -> compute new (unseen) comment counts.
        $views = DB::table('task_views')
            ->where('user_id', $user->id)
            ->whereIn('task_id', $tasks->pluck('id'))
            ->pluck('last_viewed_at', 'task_id');

        $newCounts = Comment::whereIn('task_id', $tasks->pluck('id'))
            ->get(['task_id', 'created_at'])
            ->groupBy('task_id')
            ->map(function ($group, $taskId) use ($views) {
                $seenAt = $views[$taskId] ?? null;
                return $group->filter(fn ($c) => ! $seenAt || $c->created_at->gt($seenAt))->count();
            });

        $tasks = $tasks->map(fn (Task $t) => [
            'uuid'        => $t->uuid,
            'task_no'     => $t->task_no,
            'title'       => $t->title,
            'project'     => $t->project?->name,
            'project_uuid' => $t->project?->uuid,
            'status'      => $t->status,
            'priority'    => $t->priority,
            'platform'    => $t->platform,
            'due_date'    => $t->due_date?->toDateString(),
            'completed_at' => $t->completed_at?->toDateTimeString(),
            'created_at'  => $t->created_at?->toIso8601String(),
            'is_new'      => $t->created_at && $t->created_at->gt(now()->subDays(7)),
            'assignees'   => $t->assignees->pluck('name'),
            'attachments' => $t->attachments_count,
            'comments'    => $t->comments_count,
            'new_comments' => $newCounts[$t->id] ?? 0,
            'can_modify'        => $this->canModify($user, $t),
            'can_change_status' => $this->canChangeStatus($user, $t),
        ]);

        return Inertia::render('Tasks/Index', [
            'tasks'     => $tasks,
            'canCreate' => $user->hasPermission('tasks.create'),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('permission', 'tasks.create');

        $projectIds = $this->visibleProjects($request->user())->pluck('id');

        return Inertia::render('Tasks/Create', [
            'projects' => $this->visibleProjects($request->user())->get(['id', 'name']),
            'users'    => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'parentTasks' => Task::whereIn('project_id', $projectIds)->orderBy('title')->get(['id', 'title', 'project_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'tasks.create');

        $data = $request->validate([
            'project_id'      => ['required', 'exists:projects,id'],
            'parent_task_id'  => ['nullable', 'exists:tasks,id'],
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'start_date'      => ['required', 'date'],
            'due_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'priority'        => ['required', 'in:urgent,high,normal,low'],
            'status'          => ['required', 'in:todo,in_progress,under_review,done,blocked'],
            'platform'        => ['required', 'in:web,android,both'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'assignee_ids'    => ['required', 'array', 'min:1'],
            'assignee_ids.*'  => ['exists:users,id'],
            'watcher_ids'     => ['array'],
            'watcher_ids.*'   => ['exists:users,id'],
        ], [
            'assignee_ids.required' => 'Assign the task to at least one member.',
            'assignee_ids.min'      => 'Assign the task to at least one member.',
        ]);

        // Can only attach a task to a project the user can access.
        abort_unless($this->visibleProjects($request->user())->whereKey($data['project_id'])->exists(), 403);

        $task = Task::create([
            ...collect($data)->except(['assignee_ids', 'watcher_ids'])->all(),
            'reporter_id' => $request->user()->id,
        ]);

        $task->assignees()->sync($data['assignee_ids'] ?? []);
        $task->watchers()->sync($data['watcher_ids'] ?? []);

        return redirect()->route('tasks.index')->with('status', 'Task created.');
    }

    public function edit(Request $request, Task $task): Response
    {
        $user = $request->user();
        $task->loadMissing(['assignees:id', 'watchers:id']);
        abort_unless($this->visibleProjects($user)->whereKey($task->project_id)->exists() && $this->canModify($user, $task), 403);

        $projectIds = $this->visibleProjects($user)->pluck('id');

        return Inertia::render('Tasks/Edit', [
            'task' => [
                'uuid'            => $task->uuid,
                'project_id'      => $task->project_id,
                'parent_task_id'  => $task->parent_task_id,
                'title'           => $task->title,
                'description'     => $task->description,
                'start_date'      => $task->start_date?->toDateString(),
                'due_date'        => $task->due_date?->toDateString(),
                'priority'        => $task->priority,
                'status'          => $task->status,
                'platform'        => $task->platform,
                'estimated_hours' => $task->estimated_hours,
                'assignee_ids'    => $task->assignees->pluck('id'),
                'watcher_ids'     => $task->watchers->pluck('id'),
            ],
            'projects' => $this->visibleProjects($user)->get(['id', 'name']),
            'users'    => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'parentTasks' => Task::whereIn('project_id', $projectIds)->whereKeyNot($task->id)->orderBy('title')->get(['id', 'title', 'project_id']),
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($user)->whereKey($task->project_id)->exists() && $this->canModify($user, $task), 403);

        $data = $request->validate([
            'project_id'      => ['required', 'exists:projects,id'],
            'parent_task_id'  => ['nullable', 'exists:tasks,id', 'different:'.$task->id],
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'start_date'      => ['required', 'date'],
            'due_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'priority'        => ['required', 'in:urgent,high,normal,low'],
            'status'          => ['required', 'in:todo,in_progress,under_review,done,blocked'],
            'platform'        => ['required', 'in:web,android,both'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'assignee_ids'    => ['required', 'array', 'min:1'],
            'assignee_ids.*'  => ['exists:users,id'],
            'watcher_ids'     => ['array'],
            'watcher_ids.*'   => ['exists:users,id'],
        ], [
            'assignee_ids.required' => 'Assign the task to at least one member.',
            'assignee_ids.min'      => 'Assign the task to at least one member.',
        ]);

        // Target project must also be visible.
        abort_unless($this->visibleProjects($user)->whereKey($data['project_id'])->exists(), 403);

        $task->update([
            ...collect($data)->except(['assignee_ids', 'watcher_ids'])->all(),
            'completed_at' => $data['status'] === 'done' ? ($task->completed_at ?? now()) : null,
        ]);
        $task->assignees()->sync($data['assignee_ids']);
        $task->watchers()->sync($data['watcher_ids'] ?? []);

        return redirect()->route('tasks.show', $task->uuid)->with('status', 'Task updated.');
    }

    /** Task detail + threaded comments. */
    public function show(Request $request, Task $task): Response
    {
        $user = $request->user();
        abort_unless($this->visibleProjects($user)->whereKey($task->project_id)->exists(), 403);

        $this->recordView($task, $user);

        $task->load([
            'project:id,uuid,name',
            'assignees:id,name',
            'watchers:id,name',
            'reporter:id,name',
            'attachments',
            'parent:id,uuid,title',
            'subtasks:id,uuid,title,status,due_date,parent_task_id',
            'answers' => fn ($q) => $q->with(['author:id,name', 'attachments'])->orderByDesc('is_accepted')->orderBy('created_at'),
        ]);

        return Inertia::render('Tasks/Show', [
            'task' => [
                'uuid'        => $task->uuid,
                'task_no'     => $task->task_no,
                'title'       => $task->title,
                'description' => $task->description,
                'status'      => $task->status,
                'priority'    => $task->priority,
                'platform'    => $task->platform,
                'start_date'  => $task->start_date?->toDateString(),
                'due_date'    => $task->due_date?->toDateString(),
                'completed_at' => $task->completed_at?->toDateTimeString(),
                'project'     => $task->project?->name,
                'project_uuid' => $task->project?->uuid,
                'reporter'    => $task->reporter?->name,
                'assignees'   => $task->assignees->pluck('name'),
                'watchers'    => $task->watchers->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                'watcher_ids' => $task->watchers->pluck('id'),
                'parent'      => $task->parent ? ['uuid' => $task->parent->uuid, 'title' => $task->parent->title] : null,
                'subtasks'    => $task->subtasks->map(fn ($s) => [
                    'uuid' => $s->uuid, 'title' => $s->title, 'status' => $s->status, 'due_date' => $s->due_date?->toDateString(),
                ]),
                'attachments' => $task->attachments->map(fn ($a) => [
                    'title' => $a->title, 'url' => route('attachments.show', $a->id), 'file_type' => $a->file_type,
                ]),
                'answers'     => $task->answers->map(fn ($a) => [
                    'id'          => $a->id,
                    'body'        => $a->body,
                    'author'      => $a->author?->name,
                    'is_accepted' => $a->is_accepted,
                    'created_at'  => $a->created_at?->diffForHumans(),
                    'can_delete'  => $user->isSuperAdmin() || $a->user_id === $user->id,
                    'attachments' => $a->attachments->map(fn ($t) => [
                        'title' => $t->title, 'url' => route('attachments.show', $t->id), 'file_type' => $t->file_type,
                    ]),
                ]),
            ],
            'comments' => Comment::treeForTask($task),
            'users'    => $this->canModify($user, $task)
                ? User::active()->orderBy('name')->get(['id', 'name', 'employee_id'])
                : [],
            'canChangeStatus' => $this->canChangeStatus($user, $task),
            'canModify' => $this->canModify($user, $task),
            'canAnswer' => $this->canAnswer($user, $task),
            'canAccept' => $this->canModify($user, $task),
        ]);
    }

    /** Public, read-only task view — shareable by uuid link, no auth required. */
    public function publicShow(Task $task): Response
    {
        $task->load([
            'project:id,name',
            'assignees:id,name',
            'reporter:id,name',
            'attachments',
            'answers' => fn ($q) => $q->with(['author:id,name', 'attachments'])->orderByDesc('is_accepted')->orderBy('created_at'),
        ]);

        return Inertia::render('Tasks/Public', [
            'task' => [
                'task_no'      => $task->task_no,
                'title'        => $task->title,
                'description'  => $task->description,
                'status'       => $task->status,
                'priority'     => $task->priority,
                'platform'     => $task->platform,
                'start_date'   => $task->start_date?->toDateString(),
                'due_date'     => $task->due_date?->toDateString(),
                'completed_at' => $task->completed_at?->toDateTimeString(),
                'project'      => $task->project?->name,
                'reporter'     => $task->reporter?->name,
                'assignees'    => $task->assignees->pluck('name'),
                'attachments'  => $task->attachments->map(fn ($a) => [
                    'title' => $a->title, 'url' => $a->url, 'file_type' => $a->file_type,
                ]),
                'answers'      => $task->answers->map(fn ($a) => [
                    'id'          => $a->id,
                    'body'        => $a->body,
                    'author'      => $a->author?->name,
                    'is_accepted' => $a->is_accepted,
                    'created_at'  => $a->created_at?->diffForHumans(),
                    'attachments' => $a->attachments->map(fn ($t) => [
                        'title' => $t->title, 'url' => $t->url, 'file_type' => $t->file_type,
                    ]),
                ]),
            ],
            'comments' => Comment::treeForTask($task),
        ]);
    }

    /** JSON comment thread for the popup viewer on the tasks board. */
    public function comments(Request $request, Task $task)
    {
        $user = $request->user();
        abort_unless($this->visibleProjects($user)->whereKey($task->project_id)->exists(), 403);

        $this->recordView($task, $user);

        return response()->json([
            'task'     => ['uuid' => $task->uuid, 'title' => $task->title],
            'comments' => Comment::treeForTask($task),
            'can_comment' => true,
        ]);
    }

    private function recordView(Task $task, User $user): void
    {
        DB::table('task_views')->updateOrInsert(
            ['task_id' => $task->id, 'user_id' => $user->id],
            ['last_viewed_at' => now()]
        );
    }

    /**
     * Can modify task metadata / upload attachments?
     * Managers/admins (tasks.assign) any task; reporter or assignee otherwise.
     */
    private function canModify(User $user, Task $task): bool
    {
        return $user->isSuperAdmin()
            || $user->hasPermission('tasks.assign')
            || $task->reporter_id === $user->id
            || $task->assignees->contains('id', $user->id);
    }

    /** Can post an answer? Assignees (they do the work) + super-admin. */
    private function canAnswer(User $user, Task $task): bool
    {
        return $user->isSuperAdmin()
            || $task->assignees->contains('id', $user->id);
    }

    /**
     * Can change STATUS? Only the assigned users (super-admin retains override).
     * Managers/reporters cannot move a task they aren't assigned to.
     */
    private function canChangeStatus(User $user, Task $task): bool
    {
        return $user->isSuperAdmin()
            || $task->assignees->contains('id', $user->id);
    }

    /** Drag-and-drop status change (assignees + managers). */
    public function updateStatus(Request $request, Task $task): RedirectResponse|JsonResponse
    {
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($request->user())->whereKey($task->project_id)->exists(), 403);
        abort_unless($this->canChangeStatus($request->user(), $task), 403);

        $data = $request->validate([
            'status' => ['required', 'in:todo,in_progress,under_review,done,blocked'],
        ]);

        $task->update([
            'status'       => $data['status'],
            'completed_at' => $data['status'] === 'done' ? ($task->completed_at ?? now()) : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true, 'completed_at' => $task->completed_at?->toDateTimeString()]);
        }

        return back()->with('status', 'Task status updated.');
    }

    /** Inline update of tagged watchers from the task view page. */
    public function updateWatchers(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($user)->whereKey($task->project_id)->exists() && $this->canModify($user, $task), 403);

        $data = $request->validate([
            'watcher_ids'   => ['array'],
            'watcher_ids.*' => ['exists:users,id'],
        ]);

        $task->watchers()->sync($data['watcher_ids'] ?? []);

        return back()->with('status', 'Watchers updated.');
    }

    /** Attachment upload by assignees (mgi-connect central attachments + pivot). */
    public function uploadAttachment(Request $request, Task $task)
    {
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($request->user())->whereKey($task->project_id)->exists(), 403);
        abort_unless($this->canModify($request->user(), $task), 403);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
        ]);

        $path = $request->file('file')->store('task-attachments', 'public');

        $attachment = Attachment::create([
            'title'       => $request->file('file')->getClientOriginalName(),
            'url'         => Storage::disk('public')->url($path),
            'size'        => $request->file('file')->getSize(),
            'file_type'   => $request->file('file')->getMimeType(),
            'type'        => 'task',
            'uploaded_by' => $request->user()->id,
            'status'      => 1,
        ]);

        $task->attachments()->attach($attachment->id);

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back()->with('status', 'Attachment uploaded.');
    }
}

