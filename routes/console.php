<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily overdue-task email alerts (queued).
Schedule::command('tasks:overdue-alerts')->dailyAt('08:00');

// Monthly meetings: generate the 1st & 3rd Monday meetings at the start of each month.
Schedule::command('meetings:generate')->monthlyOn(1, '00:30');
// Send invitee reminders the Saturday before each meeting (checked daily).
Schedule::command('meetings:send-reminders')->dailyAt('09:00');
