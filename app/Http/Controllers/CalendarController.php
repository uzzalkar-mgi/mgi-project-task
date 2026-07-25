<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CalendarController extends Controller
{
    /** Collect the current user's calendar events (assigned task due dates + meetings). */
    private function events(Request $request): array
    {
        $user = $request->user();

        $tasks = Task::whereHas('assignees', fn ($a) => $a->where('users.id', $user->id))
            ->whereNotNull('due_date')
            ->with('project:id,name')
            ->get(['id', 'uuid', 'title', 'status', 'due_date', 'project_id'])
            ->map(fn (Task $t) => [
                'type'  => 'task',
                'date'  => $t->due_date->toDateString(),
                'title' => $t->title,
                'uuid'  => $t->uuid,
                'meta'  => $t->status,
                'link'  => '/tasks/'.$t->uuid,
            ]);

        $meetings = Meeting::whereNotNull('meeting_date')
            ->when(! $user->hasPermission('meetings.view'), fn ($q) => $q->whereHas('invitees', fn ($i) => $i->where('users.id', $user->id)))
            ->get(['uuid', 'title', 'meeting_date', 'meeting_time'])
            ->map(fn (Meeting $m) => [
                'type'  => 'meeting',
                'date'  => $m->meeting_date->toDateString(),
                'title' => $m->title,
                'uuid'  => $m->uuid,
                'meta'  => $m->meeting_time ? substr($m->meeting_time, 0, 5) : null,
                'link'  => '/meetings/'.$m->uuid,
            ]);

        return $tasks->concat($meetings)->values()->all();
    }

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render('Calendar/Index', [
            'events' => $this->events($request),
        ]);
    }

    /** Download an .ics feed of the same events. */
    public function ics(Request $request): Response
    {
        $events = $this->events($request);
        $now = now()->format('Ymd\THis\Z');
        $lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MGI//PTS//EN', 'CALSCALE:GREGORIAN'];

        foreach ($events as $i => $e) {
            $d = str_replace('-', '', $e['date']);
            $summary = str_replace(["\r", "\n", ',', ';'], [' ', ' ', '\,', '\;'], ($e['type'] === 'meeting' ? '📅 ' : '✔ ').$e['title']);
            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:'.$e['type'].'-'.$e['uuid'].'@mgi-pts';
            $lines[] = 'DTSTAMP:'.$now;
            $lines[] = 'DTSTART;VALUE=DATE:'.$d;
            $lines[] = 'SUMMARY:'.$summary;
            $lines[] = 'END:VEVENT';
        }
        $lines[] = 'END:VCALENDAR';

        return response(implode("\r\n", $lines), 200, [
            'Content-Type'        => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="mgi-calendar.ics"',
        ]);
    }
}
