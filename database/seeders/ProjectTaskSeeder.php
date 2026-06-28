<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProjectTaskSeeder extends Seeder
{
    public function run(): void
    {
        // Resolve sample actors by role (emails differ per environment).
        $byRole  = fn(string $code) => User::query()->whereHas('roles', fn($q) => $q->where('code', $code))->orderBy('id')->first();
        $admin   = $byRole('admin');
        $manager = $byRole('manager');
        $member  = $byRole('employee') ?? $manager;

        $fmcgTag   = Tag::updateOrCreate(['slug' => 'fmcg'],   ['name' => 'FMCG']);
        $cementTag = Tag::updateOrCreate(['slug' => 'cement'], ['name' => 'Cement']);

        // ---- Project 1: FMCG Primary Sales -------------------------------
        $fmcg = Project::updateOrCreate(
            ['name' => 'FMCG Primary Sales'],
            [
                'description'              => 'Primary sales operations and promotions for the FMCG division.',
                'start_date'               => '2026-06-01',
                'end_date'                 => '2026-09-30',
                'priority'                 => 'high',
                'status'                   => 'active',
                'lead_user_id'             => $manager->id,
                'primary_responsible_id'   => $manager->id,
                'secondary_responsible_id' => $member->id,
                'created_by'               => $admin->id,
            ]
        );
        $fmcg->members()->syncWithoutDetaching([
            $manager->id => ['role_in_project' => 'lead'],
            $member->id  => ['role_in_project' => 'member'],
        ]);
        $fmcg->tags()->syncWithoutDetaching([$fmcgTag->id]);

        $fmcgTasks = [
            [
                'title'       => 'Promotion: Discount and Slab (KG to KG) will update',
                'description' => 'Update promotion engine to support discount slabs based on KG-to-KG conversion.',
                'start_date'  => '2026-06-02', 'due_date' => '2026-06-20',
                'priority'    => 'high', 'status' => 'in_progress', 'assignees' => [$member->id, $manager->id],
            ],
            [
                'title'       => 'Distributor onboarding form revamp',
                'description' => 'Redesign distributor onboarding with validation and document upload.',
                'start_date'  => '2026-06-10', 'due_date' => '2026-07-05',
                'priority'    => 'normal', 'status' => 'todo', 'assignees' => [$member->id],
            ],
            [
                'title'       => 'Primary order approval workflow',
                'description' => 'Multi-step approval for primary orders above credit limit.',
                'start_date'  => '2026-06-15', 'due_date' => '2026-07-15',
                'priority'    => 'urgent', 'status' => 'under_review', 'assignees' => [$manager->id],
            ],
            [
                'title'       => 'Sales target dashboard (region-wise)',
                'description' => 'Region-wise primary sales target vs achievement dashboard.',
                'start_date'  => '2026-07-01', 'due_date' => '2026-08-01',
                'priority'    => 'normal', 'status' => 'blocked', 'assignees' => [$member->id],
            ],
        ];
        $this->makeTasks($fmcg, $fmcgTasks, $manager, [$fmcgTag->id]);

        // ---- Project 2: Cement -------------------------------------------
        $cement = Project::updateOrCreate(
            ['name' => 'Cement'],
            [
                'description'              => 'Sales tracking and reporting for the Cement business unit.',
                'start_date'               => '2026-06-01',
                'end_date'                 => '2026-10-31',
                'priority'                 => 'medium',
                'status'                   => 'active',
                'lead_user_id'             => $manager->id,
                'primary_responsible_id'   => $admin->id,
                'secondary_responsible_id' => $manager->id,
                'created_by'               => $admin->id,
            ]
        );
        $cement->members()->syncWithoutDetaching([
            $manager->id => ['role_in_project' => 'lead'],
            $member->id  => ['role_in_project' => 'member'],
        ]);
        $cement->tags()->syncWithoutDetaching([$cementTag->id]);

        $cementTasks = [
            [
                'title'       => 'Employee achievement and target report',
                'description' => 'Monthly employee-wise achievement vs target report with export.',
                'start_date'  => '2026-06-03', 'due_date' => '2026-06-25',
                'priority'    => 'high', 'status' => 'in_progress', 'assignees' => [$member->id],
            ],
            [
                'title'       => 'Dealer ledger reconciliation',
                'description' => 'Reconcile dealer ledgers with accounting for Q2.',
                'start_date'  => '2026-06-12', 'due_date' => '2026-07-10',
                'priority'    => 'normal', 'status' => 'todo', 'assignees' => [$manager->id, $member->id],
            ],
            [
                'title'       => 'Bag dispatch tracking integration',
                'description' => 'Integrate plant dispatch data for real-time bag tracking.',
                'start_date'  => '2026-07-05', 'due_date' => '2026-08-15',
                'priority'    => 'low', 'status' => 'todo', 'assignees' => [$member->id],
            ],
            [
                'title'       => 'Q2 sales performance review',
                'description' => 'Compile and present Q2 cement sales performance.',
                'start_date'  => '2026-06-01', 'due_date' => '2026-06-15',
                'priority'    => 'normal', 'status' => 'done', 'assignees' => [$manager->id],
            ],
        ];
        $this->makeTasks($cement, $cementTasks, $manager, [$cementTag->id]);

        // ---- Milestones --------------------------------------------------
        $this->makeMilestones($fmcg, [
            ['Promotion engine live', '2026-06-22', 'Discount slab feature in production.'],
            ['Distributor portal launch', '2026-07-20', 'New onboarding portal go-live.'],
            ['FMCG v1 release', '2026-09-25', 'Phase-1 feature complete.'],
        ]);
        $this->makeMilestones($cement, [
            ['Reporting module ready', '2026-06-28', 'Achievement vs target report shipped.'],
            ['Dispatch integration', '2026-08-18', 'Plant dispatch data integrated.'],
            ['Cement v1 release', '2026-10-28', 'Phase-1 feature complete.'],
        ]);
    }

    private function makeMilestones(Project $project, array $rows): void
    {
        foreach ($rows as [$name, $date, $desc]) {
            \App\Models\Milestone::updateOrCreate(
                ['project_id' => $project->id, 'name' => $name],
                ['date' => $date, 'description' => $desc]
            );
        }
    }

    /** Create tasks for a project, attach assignees + tags. */
    private function makeTasks(Project $project, array $tasks, User $reporter, array $tagIds): void
    {
        foreach ($tasks as $t) {
            $task = Task::updateOrCreate(
                ['project_id' => $project->id, 'title' => $t['title']],
                [
                    'description'     => $t['description'],
                    'reporter_id'     => $reporter->id,
                    'start_date'      => $t['start_date'],
                    'due_date'        => $t['due_date'],
                    'priority'        => $t['priority'],
                    'status'          => $t['status'],
                    'estimated_hours' => $t['estimated_hours'] ?? null,
                ]
            );
            $task->assignees()->syncWithoutDetaching($t['assignees']);
            $task->tags()->syncWithoutDetaching($tagIds);
        }
    }
}
