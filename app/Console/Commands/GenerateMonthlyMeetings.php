<?php

namespace App\Console\Commands;

use App\Models\Meeting;
use App\Models\MeetingSetting;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

#[Signature('meetings:generate {--month= : YYYY-MM to generate for (defaults to current month)}')]
#[Description('Create recurring monthly meetings per admin schedule settings (idempotent).')]
class GenerateMonthlyMeetings extends Command
{
    public function handle(): int
    {
        $settings = MeetingSetting::current();

        if (! $settings->enabled) {
            $this->warn('Auto-generation is disabled in meeting settings.');

            return self::SUCCESS;
        }

        $base = $this->option('month')
            ? Carbon::createFromFormat('Y-m', $this->option('month'))->startOfMonth()
            : Carbon::today()->startOfMonth();

        $monthLabel    = $base->format('F Y');
        $firstWeekday  = $base->copy()->firstOfMonth($settings->weekday); // 1st <weekday> of month
        $activeUserIds = $settings->invite_all
            ? User::active()->pluck('id')
            : User::active()->whereIn('id', $settings->invitee_ids ?: [])->pluck('id');
        $ordinals      = [1 => '1st', 2 => '2nd', 3 => '3rd', 4 => '4th', 5 => '5th'];

        foreach ($settings->weeks as $week) {
            $date = $firstWeekday->copy()->addWeeks($week - 1);
            if ($date->month !== $base->month) {
                continue; // e.g. no 5th occurrence this month
            }

            $ord = $ordinals[$week] ?? "{$week}th";
            $meeting = Meeting::firstOrCreate(
                ['meeting_date' => $date->toDateString(), 'slot' => "week_{$week}"],
                ['title' => "Monthly Meeting — {$ord} Week ({$monthLabel})", 'meeting_time' => $settings->meeting_time, 'status' => 'scheduled']
            );

            if ($meeting->wasRecentlyCreated && $activeUserIds->isNotEmpty()) {
                $meeting->invitees()->syncWithoutDetaching($activeUserIds->all());
            }

            $this->line("Ensured: {$meeting->title} on {$date->toDateString()}");
        }

        $this->info('Meetings generated per schedule.');

        return self::SUCCESS;
    }
}
