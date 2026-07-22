<?php

namespace App\Console\Commands;

use App\Mail\MeetingReminderMail;
use App\Models\AppNotification;
use App\Models\Meeting;
use App\Models\MeetingSetting;
use App\Models\NotificationSetting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

#[Signature('meetings:send-reminders {--force : Send now for all upcoming scheduled meetings, ignoring the Sat/Sun window}')]
#[Description('Email invitees the Saturday & Sunday before each scheduled meeting (queued).')]
class SendMeetingReminders extends Command
{
    public function handle(): int
    {
        $today = Carbon::today();
        $force = (bool) $this->option('force');
        $offsets = MeetingSetting::current()->reminder_offsets ?: [2, 1];

        $notifySettings = NotificationSetting::current();
        $mailOn   = $notifySettings->meeting_mail;
        $notifyOn = $notifySettings->meeting_notify;

        // Self-heal: make sure this month's meetings exist (idempotent) before mailing.
        $this->call('meetings:generate');

        $meetings = Meeting::where('status', 'scheduled')
            ->whereDate('meeting_date', '>=', $today)
            ->with('invitees:id,email,name,notify_meeting_mail,notify_meeting_app')
            ->get();

        $sent = 0;

        foreach ($meetings as $meeting) {
            // Reminder days = meeting_date minus each configured offset (e.g. Sat & Sun before).
            $isReminderDay = collect($offsets)->contains(
                fn ($d) => $today->isSameDay($meeting->meeting_date->copy()->subDays((int) $d))
            );

            if (! $force) {
                if (! $isReminderDay) {
                    continue;
                }
                // Avoid duplicate sends within the same day (scheduler safety).
                if ($meeting->reminder_sent_at && $meeting->reminder_sent_at->isSameDay($today)) {
                    continue;
                }
            }

            $mailCount = 0;
            foreach ($meeting->invitees as $user) {
                // Mail — global switch AND user preference.
                if ($mailOn && $user->notify_meeting_mail && $user->email) {
                    Mail::to($user->email)->queue(new MeetingReminderMail($meeting));
                    $mailCount++;
                }
                // In-app notification — global switch AND user preference.
                if ($notifyOn && $user->notify_meeting_app) {
                    AppNotification::create([
                        'user_id' => $user->id,
                        'type'    => 'meeting',
                        'message' => "Upcoming meeting: {$meeting->title} on ".$meeting->meeting_date->format('D, d M Y'),
                        'data'    => ['meeting_uuid' => $meeting->uuid, 'link' => '/meetings/'.$meeting->uuid],
                        'is_read' => false,
                    ]);
                }
            }

            if ($mailCount === 0 && ! $notifyOn) {
                continue;
            }

            $meeting->forceFill(['reminder_sent_at' => now()])->save();
            $sent++;
            $this->line("Reminder for #{$meeting->id} ({$meeting->title}) → {$mailCount} mail(s)".($notifyOn ? ' + notifications' : ''));
        }

        $this->info("Queued reminders for {$sent} meeting(s).");

        return self::SUCCESS;
    }
}
