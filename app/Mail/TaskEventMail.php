<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskEventMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Task $task,
        public string $event,
        public string $subjectLine,
        public string $message,
        public string $link,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subjectLine);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.tasks.event',
            with: [
                'event'    => $this->event,
                'message'  => $this->message,
                'title'    => $this->task->title,
                'taskNo'   => $this->task->task_no,
                'project'  => $this->task->project?->name,
                'dueDate'  => $this->task->due_date?->format('l, d M Y'),
                'priority' => ucfirst($this->task->priority),
                'status'   => ucwords(str_replace('_', ' ', $this->task->status)),
                'appName'  => config('app.name'),
                'url'      => rtrim(config('app.url'), '/').$this->link,
            ],
        );
    }
}
