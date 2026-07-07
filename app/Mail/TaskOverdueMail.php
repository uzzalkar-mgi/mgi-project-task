<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskOverdueMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Task $task)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Overdue Task: '.$this->task->title,
        );
    }

    private function overdueLabel(): string
    {
        if (! $this->task->due_date) {
            return 'Overdue';
        }
        $days = (int) $this->task->due_date->startOfDay()->diffInDays(now()->startOfDay());

        return $days > 0 ? "Overdue by {$days} day".($days === 1 ? '' : 's') : 'Overdue';
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tasks.overdue',
            with: [
                'title'    => $this->task->title,
                'project'  => $this->task->project?->name,
                'dueDate'  => $this->task->due_date?->format('l, d M Y'),
                'overdueLabel' => $this->overdueLabel(),
                'priority' => ucfirst($this->task->priority),
                'status'   => ucwords(str_replace('_', ' ', $this->task->status)),
                'appName'  => config('app.name'),
                'url'      => rtrim(config('app.url'), '/').'/tasks',
            ],
        );
    }
}
