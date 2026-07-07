<?php

namespace App\Console\Commands;

use App\Mail\MeetingReminderMail;
use App\Models\Meeting;
use App\Models\MeetingSetting;
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

        // Self-heal: make sure this month's meetings exist (idempotent) before mailing.
        $this->call('meetings:generate');

        $meetings = Meeting::where('status', 'scheduled')
            ->whereDate('meeting_date', '>=', $today)
            ->with('invitees:id,email')
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

            $emails = $meeting->invitees->pluck('email')->filter()->unique()->values();
            if ($emails->isEmpty()) {
                continue;
            }

            foreach ($emails as $email) {
                Mail::to($email)->queue(new MeetingReminderMail($meeting));
            }

            $meeting->forceFill(['reminder_sent_at' => now()])->save();
            $sent++;
            $this->line("Queued reminder for #{$meeting->id} ({$meeting->title}) → {$emails->count()} invitee(s)");
        }

        $this->info("Queued reminders for {$sent} meeting(s).");

        return self::SUCCESS;
    }
}
