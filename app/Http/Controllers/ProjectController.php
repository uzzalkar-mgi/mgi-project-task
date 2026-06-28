<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * List projects with health summary. Visible to anyone with projects.view;
     * members see only their projects, managers/admins see all.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Project::query()
            ->visibleTo($user)
            ->with(['lead:id,name', 'primaryResponsible:id,name', 'tags:id,name'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ])
            ->latest();

        $projects = $query->get()->map(fn (Project $p) => [
            'uuid'        => $p->uuid,
            'name'        => $p->name,
            'description' => $p->description,
            'status'      => $p->status,
            'priority'    => $p->priority,
            'start_date'  => $p->start_date?->toDateString(),
            'end_date'    => $p->end_date?->toDateString(),
            'lead'        => $p->lead?->name,
            'primary'     => $p->primaryResponsible?->name,
            'tags'        => $p->tags->pluck('name'),
            'tasks_total' => $p->tasks_count,
            'tasks_done'  => $p->completed_tasks_count,
            'progress'    => $p->tasks_count > 0 ? (int) round($p->completed_tasks_count / $p->tasks_count * 100) : 0,
        ]);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'canCreate' => $user->hasPermission('projects.create'),
        ]);
    }

    /** Create form. */
    public function create(): Response
    {
        $this->authorize('permission', 'projects.create');

        return Inertia::render('Projects/Create', [
            'users' => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'tags'  => Tag::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Persist a new project. */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'projects.create');

        $data = $request->validate([
            'name'                     => ['required', 'string', 'max:255'],
            'description'              => ['nullable', 'string'],
            'start_date'               => ['required', 'date'],
            'end_date'                 => ['required', 'date', 'after_or_equal:start_date'],
            'priority'                 => ['required', 'in:low,medium,high,critical'],
            'status'                   => ['required', 'in:active,on_hold,completed,cancelled'],
            'lead_user_id'             => ['required', 'exists:users,id'],
            'primary_responsible_id'   => ['required', 'exists:users,id'],
            'secondary_responsible_id' => ['nullable', 'exists:users,id', 'different:primary_responsible_id'],
            'member_ids'               => ['array'],
            'member_ids.*'             => ['exists:users,id'],
            'tags'                     => ['array'],
            'tags.*'                   => ['string', 'max:50'],
        ]);

        $project = Project::create([
            ...collect($data)->except(['member_ids', 'tags'])->all(),
            'created_by' => $request->user()->id,
        ]);

        $project->members()->sync(collect($data['member_ids'] ?? [])->mapWithKeys(fn ($id) => [$id => ['role_in_project' => 'member']]));
        $project->tags()->sync($this->resolveTagIds($data['tags'] ?? []));

        return redirect()->route('projects.index')->with('status', 'Project created.');
    }

    /** Map free-text tag names to ids, creating any that don't exist yet. */
    private function resolveTagIds(array $names): array
    {
        return collect($names)
            ->map(fn ($n) => trim($n))
            ->filter()
            ->unique(fn ($n) => Str::lower($n))
            ->map(fn ($n) => Tag::firstOrCreate(['slug' => Str::slug($n)], ['name' => $n])->id)
            ->all();
    }

    /** Project detail with tasks. */
    public function show(Request $request, Project $project): Response
    {
        abort_unless(Project::whereKey($project->id)->visibleTo($request->user())->exists(), 403);

        $project->load([
            'lead:id,name', 'primaryResponsible:id,name', 'secondaryResponsible:id,name',
            'members:id,name', 'tags:id,name',
            'tasks' => fn ($q) => $q->with('assignees:id,name')->orderBy('due_date'),
        ]);

        return Inertia::render('Projects/Show', [
            'project' => [
                'uuid'        => $project->uuid,
                'name'        => $project->name,
                'description' => $project->description,
                'status'      => $project->status,
                'priority'    => $project->priority,
                'start_date'  => $project->start_date?->toDateString(),
                'end_date'    => $project->end_date?->toDateString(),
                'lead'        => $project->lead?->name,
                'primary'     => $project->primaryResponsible?->name,
                'secondary'   => $project->secondaryResponsible?->name,
                'members'     => $project->members->pluck('name'),
                'tags'        => $project->tags->pluck('name'),
                'tasks'       => $project->tasks->map(fn ($t) => [
                    'uuid'      => $t->uuid,
                    'title'     => $t->title,
                    'status'    => $t->status,
                    'priority'  => $t->priority,
                    'due_date'  => $t->due_date?->toDateString(),
                    'assignees' => $t->assignees->pluck('name'),
                ]),
            ],
        ]);
    }
}
