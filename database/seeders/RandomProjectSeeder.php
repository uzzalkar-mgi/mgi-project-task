<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class RandomProjectSeeder extends Seeder
{
    private array $projectNames = [
        'Retail Distribution Revamp', 'Warehouse Automation', 'E-Commerce Portal',
        'Field Force Tracker', 'Loyalty Rewards Program', 'Supply Chain Analytics',
        'Vendor Onboarding System', 'Mobile POS Rollout', 'Credit Risk Dashboard',
        'HR Self-Service Portal', 'Inventory Optimization', 'Customer 360 Platform',
    ];

    private array $taskVerbs = ['Build', 'Design', 'Integrate', 'Migrate', 'Refactor', 'Optimize', 'Fix', 'Document', 'Test', 'Deploy'];
    private array $taskNouns = ['login flow', 'reporting module', 'payment gateway', 'dashboard', 'API endpoints', 'search feature', 'notification system', 'export tool', 'user roles', 'audit log', 'data pipeline', 'settings page'];

    private array $projectPriorities = ['low', 'medium', 'high', 'critical'];
    private array $projectStatuses = ['active', 'active', 'active', 'on_hold', 'completed'];
    private array $taskPriorities = ['urgent', 'high', 'normal', 'low'];
    private array $taskStatuses = ['todo', 'in_progress', 'under_review', 'done', 'blocked'];
    private array $platforms = ['web', 'android', 'ios'];

    public function run(): void
    {
        $users = User::active()->pluck('id')->all();
        if (empty($users)) {
            $this->command->warn('No active users — run EmployeeSeeder first.');

            return;
        }

        $projectCount = 6;
        $names = collect($this->projectNames)->shuffle()->take($projectCount);

        foreach ($names as $name) {
            $lead    = fake()->randomElement($users);
            $created = fake()->randomElement($users);
            $start   = fake()->dateTimeBetween('-2 months', '+1 month');
            $end     = fake()->dateTimeBetween($start, '+4 months');

            $project = Project::updateOrCreate(
                ['name' => $name],
                [
                    'description'              => fake()->sentence(12),
                    'start_date'               => $start->format('Y-m-d'),
                    'end_date'                 => $end->format('Y-m-d'),
                    'priority'                 => fake()->randomElement($this->projectPriorities),
                    'status'                   => fake()->randomElement($this->projectStatuses),
                    'lead_user_id'             => $lead,
                    'primary_responsible_id'   => fake()->randomElement($users),
                    'secondary_responsible_id' => fake()->randomElement($users),
                    'created_by'               => $created,
                ]
            );

            // Members = lead + a few random users.
            $memberIds = collect($users)->shuffle()->take(fake()->numberBetween(2, 4))->push($lead)->unique();
            $project->members()->syncWithoutDetaching(
                $memberIds->mapWithKeys(fn ($id) => [$id => ['role_in_project' => $id === $lead ? 'lead' : 'member']])->all()
            );

            // Multiple random tasks per project.
            $taskCount = fake()->numberBetween(4, 9);
            for ($i = 0; $i < $taskCount; $i++) {
                $tStart = fake()->dateTimeBetween('-1 month', '+1 month');
                $tDue   = fake()->dateTimeBetween($tStart, '+2 months');
                $status = fake()->randomElement($this->taskStatuses);

                $task = Task::create([
                    'project_id'      => $project->id,
                    'title'           => fake()->randomElement($this->taskVerbs).' '.fake()->randomElement($this->taskNouns),
                    'description'     => '<p>'.fake()->sentence(14).'</p>',
                    'reporter_id'     => fake()->randomElement($users),
                    'start_date'      => $tStart->format('Y-m-d'),
                    'due_date'        => $tDue->format('Y-m-d'),
                    'priority'        => fake()->randomElement($this->taskPriorities),
                    'status'          => $status,
                    'platform'        => fake()->randomElement($this->platforms),
                    'estimated_hours' => fake()->randomFloat(1, 1, 40),
                    'completed_at'    => $status === 'done' ? $tDue : null,
                ]);

                // 1–3 random assignees + optional watchers.
                $task->assignees()->syncWithoutDetaching(
                    collect($users)->shuffle()->take(fake()->numberBetween(1, 3))->all()
                );
                if (fake()->boolean(40)) {
                    $task->watchers()->syncWithoutDetaching(
                        collect($users)->shuffle()->take(fake()->numberBetween(1, 2))->all()
                    );
                }
            }

            $this->command->info("Seeded project \"{$name}\" with {$taskCount} tasks.");
        }
    }
}
