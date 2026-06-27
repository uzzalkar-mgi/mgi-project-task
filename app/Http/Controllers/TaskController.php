<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /** Projects this user is allowed to see / attach tasks to. */
    private function visibleProjects(User $user)
    {
        $q = Project::query()->orderBy('name');

        if (! $user->hasPermission('projects.create') && ! $user->isSuperAdmin()) {
            $q->where(function ($w) use ($user) {
                $w->where('lead_user_id', $user->id)
                    ->orWhere('primary_responsible_id', $user->id)
                    ->orWhere('secondary_responsible_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
            });
        }

        return $q;
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $projectIds = $this->visibleProjects($user)->pluck('id');

        $tasks = Task::whereIn('project_id', $projectIds)
            ->with(['project:id,uuid,name', 'assignees:id,name'])
            ->withCount('attachments')
            ->orderByRaw('due_date is null, due_date asc')
            ->get()
            ->map(fn (Task $t) => [
                'uuid'        => $t->uuid,
                'title'       => $t->title,
                'project'     => $t->project?->name,
                'status'      => $t->status,
                'priority'    => $t->priority,
                'due_date'    => $t->due_date?->toDateString(),
                'assignees'   => $t->assignees->pluck('name'),
                'attachments'       => $t->attachments_count,
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
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'assignee_ids'    => ['array'],
            'assignee_ids.*'  => ['exists:users,id'],
        ]);

        $task = Task::create([
            ...collect($data)->except('assignee_ids')->all(),
            'reporter_id' => $request->user()->id,
        ]);

        $task->assignees()->sync($data['assignee_ids'] ?? []);

        return redirect()->route('tasks.index')->with('status', 'Task created.');
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

