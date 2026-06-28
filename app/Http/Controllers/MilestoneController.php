<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MilestoneController extends Controller
{
    private function visibleProjectIds(User $user)
    {
        return Project::query()->visibleTo($user)->pluck('id');
    }

    public function index(Request $request): Response
    {
        $ids = $this->visibleProjectIds($request->user());

        $milestones = Milestone::whereIn('project_id', $ids)
            ->with('project:id,uuid,name')
            ->orderBy('date')
            ->get()
            ->map(fn (Milestone $m) => [
                'id'           => $m->id,
                'name'         => $m->name,
                'date'         => $m->date?->toDateString(),
                'description'  => $m->description,
                'project'      => $m->project?->name,
                'project_uuid' => $m->project?->uuid,
                'past'         => $m->date && $m->date->isPast(),
            ]);

        return Inertia::render('Milestones/Index', [
            'milestones' => $milestones,
        ]);
    }
}
