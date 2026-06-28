<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
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
            'title'       => $t->title,
            'project'     => $t->project?->name,
            'status'      => $t->status,
            'priority'    => $t->priority,
            'platform'    => $t->platform,
            'due_date'    => $t->due_date?->toDateString(),
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

        return Inertia::render('Tasks/Create', [
            'projects' => $this->visibleProjects($request->user())->get(['id', 'name']),
            'users'    => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'tasks.create');

        $data = $request->validate([
            'project_id'      => ['required', 'exists:projects,id'],
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'start_date'      => ['nullable', 'date'],
            'due_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'priority'        => ['required', 'in:urgent,high,normal,low'],
            'status'          => ['required', 'in:todo,in_progress,under_review,done,blocked'],
            'platform'        => ['required', 'in:web,android,both'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'assignee_ids'    => ['array'],
            'assignee_ids.*'  => ['exists:users,id'],
        ]);

        // Can only attach a task to a project the user can access.
        abort_unless($this->visibleProjects($request->user())->whereKey($data['project_id'])->exists(), 403);

        $task = Task::create([
            ...collect($data)->except('assignee_ids')->all(),
            'reporter_id' => $request->user()->id,
        ]);

        $task->assignees()->sync($data['assignee_ids'] ?? []);

        return redirect()->route('tasks.index')->with('status', 'Task created.');
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
            'reporter:id,name',
        ]);

        return Inertia::render('Tasks/Show', [
            'task' => [
                'uuid'        => $task->uuid,
                'title'       => $task->title,
                'description' => $task->description,
                'status'      => $task->status,
                'priority'    => $task->priority,
                'platform'    => $task->platform,
                'due_date'    => $task->due_date?->toDateString(),
                'project'     => $task->project?->name,
                'project_uuid' => $task->project?->uuid,
                'reporter'    => $task->reporter?->name,
                'assignees'   => $task->assignees->pluck('name'),
            ],
            'comments' => $this->commentTree($task),
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
            'comments' => $this->commentTree($task),
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

    /** Threaded comments (top-level + replies) with attachments. */
    private function commentTree(Task $task): array
    {
        $task->load([
            'comments' => fn ($q) => $q->whereNull('parent_id')->with([
                'author:id,name',
                'attachments',
                'replies' => fn ($r) => $r->with(['author:id,name', 'attachments'])->orderBy('created_at'),
            ])->orderBy('created_at'),
        ]);

        $map = fn ($c) => [
            'id'          => $c->id,
            'body'        => $c->body,
            'author'      => $c->author?->name,
            'created_at'  => $c->created_at?->diffForHumans(),
            'attachments' => $c->attachments->map(fn ($a) => [
                'title' => $a->title, 'url' => $a->url, 'file_type' => $a->file_type,
            ]),
        ];

        return $task->comments->map(fn ($c) => [
            ...$map($c),
            'replies' => $c->replies->map($map),
        ])->all();
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
    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($request->user())->whereKey($task->project_id)->exists(), 403);
        abort_unless($this->canChangeStatus($request->user(), $task), 403);

        $data = $request->validate([
            'status' => ['required', 'in:todo,in_progress,under_review,done,blocked'],
        ]);

        $task->update(['status' => $data['status']]);

        return back();
    }

    /** Attachment upload by assignees (mgi-connect central attachments + pivot). */
    public function uploadAttachment(Request $request, Task $task): RedirectResponse
    {
        $task->loadMissing('assignees:id');
        abort_unless($this->visibleProjects($request->user())->whereKey($task->project_id)->exists(), 403);
        abort_unless($this->canModify($request->user(), $task), 403);

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
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

        return back()->with('status', 'Attachment uploaded.');
    }
}

