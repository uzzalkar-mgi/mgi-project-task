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
            ->with([
                'tasks' => fn ($q) => $q->orderBy('start_date')->orderBy('due_date'),
                'milestones' => fn ($q) => $q->orderBy('date'),
            ])
            ->orderBy('start_date');

        if (! $user->hasPermission('projects.create') && ! $user->isSuperAdmin()) {
            $query->where(function ($w) use ($user) {
                $w->where('lead_user_id', $user->id)
                    ->orWhere('primary_responsible_id', $user->id)
                    ->orWhere('secondary_responsible_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
            });
        }

        $projects = $query->get()->map(fn (Project $p) => [
            'uuid'       => $p->uuid,
            'name'       => $p->name,
            'start_date' => $p->start_date?->toDateString(),
            'end_date'   => $p->end_date?->toDateString(),
            'status'     => $p->status,
            'tasks'      => $p->tasks->map(fn ($t) => [
                'uuid'       => $t->uuid,
                'title'      => $t->title,
                'status'     => $t->status,
                'priority'   => $t->priority,
                'start_date' => ($t->start_date ?? $t->created_at)?->toDateString(),
                'due_date'   => $t->due_date?->toDateString(),
            ]),
            'milestones' => $p->milestones->map(fn ($m) => [
                'name' => $m->name,
                'date' => $m->date?->toDateString(),
            ]),
        ]);

        return Inertia::render('Timeline/Index', [
            'projects' => $projects,
        ]);
    }
}
