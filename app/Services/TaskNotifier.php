<?php

namespace App\Services;

use App\Mail\TaskEventMail;
use App\Models\AppNotification;
use App\Models\NotificationSetting;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class TaskNotifier
{
    /**
     * Notify people on a task about an event.
     *
     * @param  'created'|'status'  $event
     */
    public static function notify(Task $task, string $event, ?User $actor = null): void
    {
        $settings = NotificationSetting::current();

        $mailOn = $event === 'created' ? $settings->task_create_mail : $settings->task_status_mail;
        $appOn  = $event === 'created' ? $settings->task_create_notify : $settings->task_status_notify;

        if (! $mailOn && ! $appOn) {
            return; // globally disabled
        }

        // Load the notify_* preference columns too (restricting to id,name,email would null them out).
        $cols = ['id', 'name', 'email', 'notify_task_create_mail', 'notify_task_status_mail', 'notify_task_create_app', 'notify_task_status_app'];
        $task->load([
            'assignees' => fn ($q) => $q->select($cols),
            'watchers'  => fn ($q) => $q->select($cols),
            'reporter'  => fn ($q) => $q->select($cols),
            'project:id,name',
        ]);

        // Recipients: assignees + watchers + reporter (deduped, minus the actor).
        $recipients = collect([$task->reporter])
            ->merge($task->assignees)
            ->merge($task->watchers)
            ->filter()
            ->unique('id')
            ->reject(fn (User $u) => $actor && $u->id === $actor->id)
            ->values();

        if ($recipients->isEmpty()) {
            return;
        }

        $statusLabels = [
            'todo' => 'To Do', 'in_progress' => 'In Progress', 'under_review' => 'Under Review',
            'done' => 'Done', 'blocked' => 'Blocked',
        ];
        $statusLabel = $statusLabels[$task->status] ?? $task->status;

        $subject = $event === 'created'
            ? "New task: {$task->title}"
            : "Task status → {$statusLabel}: {$task->title}";

        $message = $event === 'created'
            ? "New task assigned: {$task->title}".($actor ? " (by {$actor->name})" : '')
            : "Task \"{$task->title}\" moved to {$statusLabel}".($actor ? " by {$actor->name}" : '');

        $link = '/tasks/'.$task->uuid;

        // Per-user preference keys.
        $mailPref = $event === 'created' ? 'notify_task_create_mail' : 'notify_task_status_mail';
        $appPref  = $event === 'created' ? 'notify_task_create_app'  : 'notify_task_status_app';

        foreach ($recipients as $user) {
            if ($mailOn && $user->{$mailPref} && $user->email) {
                Mail::to($user->email)->queue(new TaskEventMail($task, $event, $subject, $message, $link));
            }

            if ($appOn && $user->{$appPref}) {
                AppNotification::create([
                    'user_id' => $user->id,
                    'type'    => $event === 'created' ? 'task_created' : 'task_status',
                    'message' => $message,
                    'data'    => ['task_uuid' => $task->uuid, 'link' => $link],
                    'is_read' => false,
                ]);
            }
        }
    }
}
