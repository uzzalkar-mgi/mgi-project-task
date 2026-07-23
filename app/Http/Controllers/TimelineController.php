<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Project::query()
            ->visibleTo($user)
            ->with([
                'tasks' => fn ($q) => $q->orderBy('start_date')->orderBy('due_date'),
                'tasks.dependencies',
                'tasks.assignees:id',
                'milestones' => fn ($q) => $q->orderBy('date'),
            ])
            ->orderBy('start_date');

        $projects = $query->get()->map(function (Project $p) use ($user) {
            $taskIds = $p->tasks->pluck('id')->flip(); // valid targets within this project

            // Dependency edges within the project: predecessor -> this task.
            $deps = $p->tasks->flatMap(fn ($t) => $t->dependencies
                ->filter(fn ($d) => $taskIds->has($d->depends_on_task_id))
                ->map(fn ($d) => ['from' => $d->depends_on_task_id, 'to' => $t->id]))
                ->values();

            return [
                'uuid'       => $p->uuid,
                'name'       => $p->name,
                'start_date' => $p->start_date?->toDateString(),
                'end_date'   => $p->end_date?->toDateString(),
                'status'     => $p->status,
                'tasks'      => $p->tasks->map(fn ($t) => [
                    'id'         => $t->id,
                    'uuid'       => $t->uuid,
                    'title'      => $t->title,
                    'status'     => $t->status,
                    'priority'   => $t->priority,
                    'start_date' => ($t->start_date ?? $t->created_at)?->toDateString(),
                    'due_date'   => $t->due_date?->toDateString(),
                    'can_move'   => $user->isSuperAdmin() || $user->hasRole('admin')
                        || $t->reporter_id === $user->id || $t->assignees->contains('id', $user->id),
                ]),
                'deps'       => $deps,
                'milestones' => $p->milestones->map(fn ($m) => [
                    'name' => $m->name,
                    'date' => $m->date?->toDateString(),
                ]),
            ];
        });

        return Inertia::render('Timeline/Index', [
            'projects' => $projects,
        ]);
    }
}
