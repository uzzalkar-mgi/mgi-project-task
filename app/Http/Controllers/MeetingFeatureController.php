<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Meeting;
use App\Models\MeetingActionItem;
use App\Models\MeetingAgendaItem;
use App\Models\MeetingSubmission;
use App\Models\Task;
use App\Services\TaskNotifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class MeetingFeatureController extends Controller
{
    private function canManage(Request $request): bool
    {
        return $request->user()->hasPermission('meetings.update');
    }

    // ---- Agenda ---------------------------------------------------------

    public function addAgenda(Request $request, Meeting $meeting): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $data = $request->validate([
            'title'   => ['required', 'string', 'max:255'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'minutes' => ['nullable', 'integer', 'min:0', 'max:600'],
        ]);
        $meeting->agendaItems()->create([
            ...$data,
            'position' => (int) $meeting->agendaItems()->max('position') + 1,
        ]);

        return back()->with('status', 'Agenda item added.');
    }

    public function toggleAgenda(Request $request, MeetingAgendaItem $item): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $item->update(['done' => ! $item->done, 'done_at' => $item->done ? null : now()]);

        return back();
    }

    public function deleteAgenda(Request $request, MeetingAgendaItem $item): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $item->delete();

        return back()->with('status', 'Agenda item removed.');
    }

    // ---- Pre-meeting submissions ----------------------------------------

    public function addSubmission(Request $request, Meeting $meeting): RedirectResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:5000']]);
        $meeting->submissions()->create(['user_id' => $request->user()->id, 'body' => $data['body']]);

        return back()->with('status', 'Submitted.');
    }

    public function deleteSubmission(Request $request, MeetingSubmission $submission): RedirectResponse
    {
        abort_unless($submission->user_id === $request->user()->id || $this->canManage($request), 403);
        $submission->delete();

        return back();
    }

    // ---- Attachments ----------------------------------------------------

    public function addAttachment(Request $request, Meeting $meeting): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip,ppt,pptx'],
        ]);
        $file = $request->file('file');
        $path = $file->store('meeting-attachments', 'public');
        $attachment = Attachment::create([
            'title'       => $file->getClientOriginalName(),
            'url'         => Storage::disk('public')->url($path),
            'size'        => $file->getSize(),
            'file_type'   => $file->getMimeType(),
            'type'        => 'meeting',
            'uploaded_by' => $request->user()->id,
            'status'      => 1,
        ]);
        $meeting->attachments()->attach($attachment->id);

        return back()->with('status', 'File attached.');
    }

    public function deleteAttachment(Request $request, Meeting $meeting, Attachment $attachment): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $meeting->attachments()->detach($attachment->id);

        return back();
    }

    // ---- Action items ---------------------------------------------------

    public function addAction(Request $request, Meeting $meeting): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'due_date'    => ['nullable', 'date'],
        ]);
        $meeting->actionItems()->create($data);

        return back()->with('status', 'Action item added.');
    }

    public function toggleAction(Request $request, MeetingActionItem $item): RedirectResponse
    {
        abort_unless($this->canManage($request) || $item->assignee_id === $request->user()->id, 403);
        $done = $item->status !== 'done';
        $item->update(['status' => $done ? 'done' : 'open', 'completed_at' => $done ? now() : null]);

        return back();
    }

    public function deleteAction(Request $request, MeetingActionItem $item): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        $item->delete();

        return back();
    }

    /** Turn an action item into a linked, trackable Task. */
    public function convertAction(Request $request, MeetingActionItem $item): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);
        if ($item->task_id) {
            return back()->with('error', 'Already linked to a task.');
        }
        $data = $request->validate([
            'project_id'  => ['required', 'exists:projects,id'],
            'assignee_id' => ['required', 'exists:users,id'],
            'due_date'    => ['required', 'date'],
        ]);

        $task = Task::create([
            'project_id'  => $data['project_id'],
            'title'       => $item->title,
            'description' => '<p>From meeting action item.</p>',
            'reporter_id' => $request->user()->id,
            'created_by'  => $request->user()->id,
            'start_date'  => now()->toDateString(),
            'due_date'    => $data['due_date'],
            'priority'    => 'normal',
            'status'      => 'todo',
            'platform'    => 'web',
        ]);
        $task->assignees()->sync([$data['assignee_id']]);
        TaskNotifier::notify($task, 'created', $request->user());

        $item->update(['task_id' => $task->id, 'assignee_id' => $data['assignee_id'], 'due_date' => $data['due_date']]);

        return back()->with('status', 'Task created from action item.');
    }

    /** Roll this meeting's still-open action items into another (usually the next) meeting. */
    public function carryForward(Request $request, Meeting $meeting): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $target = Meeting::where('meeting_date', '>', $meeting->meeting_date)
            ->where('status', 'scheduled')
            ->orderBy('meeting_date')
            ->first();

        if (! $target) {
            return back()->with('error', 'No upcoming meeting to carry items into.');
        }

        $open = $meeting->actionItems()->where('status', 'open')->get();
        foreach ($open as $ai) {
            $target->actionItems()->create([
                'title'       => $ai->title,
                'assignee_id' => $ai->assignee_id,
                'due_date'    => $ai->due_date,
                'status'      => 'open',
                'carried_from_meeting_id' => $meeting->id,
            ]);
        }

        return back()->with('status', $open->count().' item(s) carried into '.$target->title.'.');
    }

    // ---- Per-meeting .ics ----------------------------------------------

    public function ics(Meeting $meeting): Response
    {
        $date = str_replace('-', '', $meeting->meeting_date->toDateString());
        $time = $meeting->meeting_time ? str_replace(':', '', substr($meeting->meeting_time, 0, 5)).'00' : null;
        $now = now()->format('Ymd\THis\Z');
        $summary = str_replace([',', ';'], ['\,', '\;'], $meeting->title);

        $lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MGI//PTS//EN', 'BEGIN:VEVENT',
            'UID:meeting-'.$meeting->uuid.'@mgi-pts', 'DTSTAMP:'.$now];
        if ($time) {
            $lines[] = 'DTSTART:'.$date.'T'.$time;
        } else {
            $lines[] = 'DTSTART;VALUE=DATE:'.$date;
        }
        $lines[] = 'SUMMARY:'.$summary;
        $lines[] = 'END:VEVENT';
        $lines[] = 'END:VCALENDAR';

        return response(implode("\r\n", $lines), 200, [
            'Content-Type'        => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="meeting-'.$meeting->uuid.'.ics"',
        ]);
    }

    // ---- Ad-hoc quick meeting ------------------------------------------

    public function quickMeeting(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('meetings.create'), 403);
        $data = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'meeting_time' => ['nullable'],
            'invitee_ids'  => ['array'],
            'invitee_ids.*' => ['exists:users,id'],
        ]);

        $meeting = Meeting::create([
            'title'        => $data['title'],
            'meeting_date' => $data['meeting_date'],
            'meeting_time' => $data['meeting_time'] ?? null,
            'status'       => 'scheduled',
            'slot'         => 'adhoc',
            'created_by'   => $request->user()->id,
        ]);
        $meeting->invitees()->sync($data['invitee_ids'] ?? []);

        return redirect()->route('meetings.show', $meeting->uuid)->with('status', 'Meeting created.');
    }
}
