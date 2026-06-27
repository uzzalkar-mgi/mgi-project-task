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

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.tasks.overdue',
            with: [
                'task'        => $this->task,
                'project'     => $this->task->project?->name,
                'dueDate'     => $this->task->due_date?->format('d M Y'),
                'description' => $this->task->description ?: 'No description provided.',
            ],
        );
    }
}
