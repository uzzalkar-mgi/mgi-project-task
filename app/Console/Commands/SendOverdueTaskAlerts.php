<?php

namespace App\Console\Commands;

use App\Mail\TaskOverdueMail;
use App\Models\AppNotification;
use App\Models\Task;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

#[Signature('tasks:overdue-alerts')]
#[Description('Email project lead + primary responsible for tasks past due date (queued).')]
class SendOverdueTaskAlerts extends Command
{
    public function handle(): int
    {
        $today = Carbon::today();

        $tasks = Task::query()
            ->whereDate('due_date', '<', $today)
            ->whereNotIn('status', ['done'])
            ->whereNull('overdue_alerted_at')
            ->with(['project.lead:id,name,email', 'project.primaryResponsible:id,name,email'])
            ->get();

        if ($tasks->isEmpty()) {
            $this->info('No overdue tasks to alert.');

            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($tasks as $task) {
            // Recipient users: project lead + primary responsible (deduped).
            $users = collect([$task->project?->lead, $task->project?->primaryResponsible])
                ->filter()
                ->unique('id')
                ->values();

            if ($users->isEmpty()) {
                continue;
            }

            // Email (queued mailable).
            Mail::to($users->pluck('email')->all())->queue(new TaskOverdueMail($task));

            // In-app notification per recipient.
            foreach ($users as $user) {
                AppNotification::create([
                    'user_id' => $user->id,
                    'type'    => 'overdue',
                    'message' => "Overdue task: {$task->title}",
                    'data'    => ['task_uuid' => $task->uuid, 'project' => $task->project?->name, 'link' => '/tasks'],
                    'is_read' => false,
                ]);
            }

            $task->forceFill(['overdue_alerted_at' => now()])->save();
            $sent++;

            $this->line("Queued alert for task #{$task->id} ({$task->title}) → {$users->pluck('email')->implode(', ')}");
        }

        $this->info("Queued {$sent} overdue-task alert(s).");

        return self::SUCCESS;
    }
}
