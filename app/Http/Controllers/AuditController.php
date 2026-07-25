<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    private const ACTIONS = ['created', 'updated', 'status', 'commented', 'answered', 'logged'];

    /** Global, filterable audit log (admin). */
    public function index(Request $request): Response
    {
        $this->authorize('permission', 'users.manage');

        $filters = $request->validate([
            'q'          => ['nullable', 'string', 'max:100'],
            'user_id'    => ['nullable', 'integer'],
            'action'     => ['nullable', 'in:'.implode(',', self::ACTIONS)],
            'project_id' => ['nullable', 'integer'],
            'from'       => ['nullable', 'date'],
            'to'         => ['nullable', 'date'],
        ]);

        $page = Activity::query()
            ->with('user:id,name')
            ->when($filters['q'] ?? null, fn ($q, $v) => $q->where('description', 'ilike', "%{$v}%"))
            ->when($filters['user_id'] ?? null, fn ($q, $v) => $q->where('user_id', $v))
            ->when($filters['action'] ?? null, fn ($q, $v) => $q->where('action', $v))
            ->when($filters['project_id'] ?? null, fn ($q, $v) => $q->where('project_id', $v))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->latest()
            ->paginate(30)
            ->withQueryString();

        // Resolve task uuids + project meta for links (batch).
        $taskIds = collect($page->items())->where('subject_type', Task::class)->pluck('subject_id')->unique();
        $taskUuids = Task::whereIn('id', $taskIds)->pluck('uuid', 'id');
        $projects = Project::orderBy('name')->get(['id', 'uuid', 'name']);
        $projMeta = $projects->keyBy('id');

        $page->through(fn (Activity $a) => [
            'id'          => $a->id,
            'user'        => $a->user?->name ?? 'System',
            'action'      => $a->action,
            'description' => $a->description,
            'subject'     => class_basename($a->subject_type),
            'task_uuid'   => $a->subject_type === Task::class ? ($taskUuids[$a->subject_id] ?? null) : null,
            'project'     => $a->project_id ? ($projMeta[$a->project_id]->name ?? null) : null,
            'project_uuid' => $a->project_id ? ($projMeta[$a->project_id]->uuid ?? null) : null,
            'at'          => $a->created_at?->format('d M Y, H:i'),
            'ago'         => $a->created_at?->diffForHumans(),
        ]);

        return Inertia::render('Audit/Index', [
            'logs'    => $page,
            'filters' => $filters,
            'users'   => User::orderBy('name')->get(['id', 'name']),
            'projects' => $projects->map(fn ($p) => ['id' => $p->id, 'name' => $p->name]),
            'actions' => self::ACTIONS,
        ]);
    }
}
