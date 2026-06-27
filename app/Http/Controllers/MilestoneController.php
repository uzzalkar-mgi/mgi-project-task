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
        $q = Project::query();
        if (! $user->hasPermission('projects.create') && ! $user->isSuperAdmin()) {
            $q->where(function ($w) use ($user) {
                $w->where('lead_user_id', $user->id)
                    ->orWhere('primary_responsible_id', $user->id)
                    ->orWhere('secondary_responsible_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
            });
        }
        return $q->pluck('id');
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
