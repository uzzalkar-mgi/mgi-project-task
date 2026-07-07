<?php

namespace App\Mail;

use App\Models\Meeting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Meeting $meeting)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Meeting Reminder: '.$this->meeting->title);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.meetings.reminder',
            with: [
                'title'   => $this->meeting->title,
                'date'    => $this->meeting->meeting_date?->format('l, d M Y'),
                'time'    => $this->meeting->meeting_time ? substr($this->meeting->meeting_time, 0, 5) : null,
                'appName' => config('app.name'),
                'url'     => rtrim(config('app.url'), '/').'/meetings',
            ],
        );
    }
}
