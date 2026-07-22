<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\MeetingSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MeetingController extends Controller
{
    public function index(): Response
    {
        $this->authorize('permission', 'meetings.view');

        $meetings = Meeting::withCount(['invitees', 'attendees'])
            ->orderByDesc('meeting_date')
            ->get()
            ->map(fn (Meeting $m) => [
                'uuid'          => $m->uuid,
                'title'         => $m->title,
                'meeting_date'  => $m->meeting_date?->toDateString(),
                'meeting_time'  => $m->meeting_time,
                'status'        => $m->status,
                'invitees'      => $m->invitees_count,
                'attendees'     => $m->attendees_count,
                'reminder_sent' => (bool) $m->reminder_sent_at,
            ]);

        return Inertia::render('Meetings/Index', [
            'meetings'  => $meetings,
            'canManage' => request()->user()->hasPermission('meetings.create'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('permission', 'meetings.create');

        return Inertia::render('Meetings/Form', [
            'meeting' => null,
            'users'   => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'invited' => [],
        ]);
    }

    public function edit(Meeting $meeting): Response|RedirectResponse
    {
        $this->authorize('permission', 'meetings.update');

        if ($meeting->status === 'completed') {
            return redirect()->route('meetings.show', $meeting->uuid)->with('error', 'Completed meetings cannot be edited.');
        }

        return Inertia::render('Meetings/Form', [
            'meeting' => [
                'uuid'         => $meeting->uuid,
                'title'        => $meeting->title,
                'meeting_date' => $meeting->meeting_date?->toDateString(),
                'meeting_time' => $meeting->meeting_time,
                'status'       => $meeting->status,
            ],
            'users'   => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
            'invited' => $meeting->invitees()->pluck('users.id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'meetings.create');
        $data = $this->validateMeeting($request);

        $meeting = Meeting::create([
            'title'        => $data['title'],
            'meeting_date' => $data['meeting_date'],
            'meeting_time' => $data['meeting_time'] ?? null,
            'status'       => $data['status'] ?? 'scheduled',
            'slot'         => 'adhoc',
            'created_by'   => $request->user()->id,
        ]);
        $meeting->invitees()->sync($data['invitee_ids'] ?? []);

        return redirect()->route('meetings.show', $meeting->uuid)->with('status', 'Meeting created.');
    }

    public function update(Request $request, Meeting $meeting): RedirectResponse
    {
        $this->authorize('permission', 'meetings.update');

        if ($meeting->status === 'completed') {
            return redirect()->route('meetings.show', $meeting->uuid)->with('error', 'Completed meetings cannot be edited.');
        }

        $data = $this->validateMeeting($request);

        $meeting->update([
            'title'        => $data['title'],
            'meeting_date' => $data['meeting_date'],
            'meeting_time' => $data['meeting_time'] ?? null,
            'status'       => $data['status'] ?? $meeting->status,
        ]);
        // Keep existing attendance rows; sync invitees without wiping attended flags.
        $meeting->invitees()->syncWithoutDetaching($data['invitee_ids'] ?? []);
        $meeting->invitees()->detach(
            $meeting->invitees()->pluck('users.id')->diff($data['invitee_ids'] ?? [])->all()
        );

        return redirect()->route('meetings.show', $meeting->uuid)->with('status', 'Meeting updated.');
    }

    public function show(Meeting $meeting): Response
    {
        $this->authorize('permission', 'meetings.view');

        $meeting->load(['creator:id,name', 'invitees:id,name,employee_id']);

        return Inertia::render('Meetings/Show', [
            'meeting' => [
                'uuid'          => $meeting->uuid,
                'title'         => $meeting->title,
                'meeting_date'  => $meeting->meeting_date?->toDateString(),
                'meeting_time'  => $meeting->meeting_time,
                'slot'          => $meeting->slot,
                'status'        => $meeting->status,
                'discussion'    => $meeting->discussion,
                'created_by'    => $meeting->creator?->name,
                'reminder_sent' => (bool) $meeting->reminder_sent_at,
                'invitees'      => $meeting->invitees->map(fn ($u) => [
                    'id'          => $u->id,
                    'name'        => $u->name,
                    'employee_id' => $u->employee_id,
                    'attended'    => (bool) $u->pivot->attended,
                    'attended_at' => $u->pivot->attended_at,
                ]),
            ],
            'canManage'     => request()->user()->hasPermission('meetings.update'),
            'canAttendance' => request()->user()->hasPermission('meetings.attendance'),
        ]);
    }

    /** Save the rich-text discussion/minutes; optionally mark completed. */
    public function saveDiscussion(Request $request, Meeting $meeting): RedirectResponse
    {
        $this->authorize('permission', 'meetings.update');
        $data = $request->validate([
            'discussion' => ['nullable', 'string'],
            'status'     => ['nullable', 'in:scheduled,completed,cancelled'],
        ]);
        $meeting->update([
            'discussion' => $data['discussion'] ?? null,
            'status'     => $data['status'] ?? $meeting->status,
        ]);

        return back()->with('status', 'Discussion saved.');
    }

    /** Admin marks who attended (stamps attended_at). */
    public function markAttendance(Request $request, Meeting $meeting): RedirectResponse
    {
        $this->authorize('permission', 'meetings.attendance');
        $data = $request->validate([
            'attendee_ids'   => ['array'],
            'attendee_ids.*' => ['integer'],
        ]);

        $attended = collect($data['attendee_ids'] ?? []);
        foreach ($meeting->invitees()->pluck('users.id') as $uid) {
            $isThere = $attended->contains($uid);
            $meeting->invitees()->updateExistingPivot($uid, [
                'attended'    => $isThere,
                'attended_at' => $isThere ? now() : null,
            ]);
        }

        return back()->with('status', 'Attendance updated.');
    }

    public function destroy(Meeting $meeting): RedirectResponse
    {
        $this->authorize('permission', 'meetings.delete');

        if ($meeting->status === 'completed') {
            return back()->with('error', 'Completed meetings cannot be deleted.');
        }

        $meeting->delete();

        return redirect()->route('meetings.index')->with('status', 'Meeting deleted.');
    }

    /** Admin-controlled recurring schedule config. */
    public function settings(): Response
    {
        $this->authorize('permission', 'meetings.update');

        return Inertia::render('Meetings/Settings', [
            'settings' => MeetingSetting::current(),
            'users'    => User::active()->orderBy('name')->get(['id', 'name', 'employee_id']),
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'meetings.update');

        $data = $request->validate([
            'enabled'            => ['boolean'],
            'weekday'            => ['required', 'integer', 'between:0,6'],
            'weeks'              => ['required', 'array', 'min:1'],
            'weeks.*'            => ['integer', 'between:1,5'],
            'meeting_time'       => ['required'],
            'reminder_offsets'   => ['array'],
            'reminder_offsets.*' => ['integer', 'between:0,14'],
            'invite_all'         => ['boolean'],
            'invitee_ids'        => ['array'],
            'invitee_ids.*'      => ['integer', 'exists:users,id'],
        ]);

        MeetingSetting::current()->update([
            'enabled'          => $data['enabled'] ?? true,
            'weekday'          => $data['weekday'],
            'weeks'            => array_values(array_unique($data['weeks'])),
            'meeting_time'     => $data['meeting_time'],
            'reminder_offsets' => array_values(array_unique($data['reminder_offsets'] ?? [])),
            'invite_all'       => $data['invite_all'] ?? false,
            'invitee_ids'      => array_values(array_unique($data['invitee_ids'] ?? [])),
        ]);

        return back()->with('status', 'Meeting schedule updated.');
    }

    private function validateMeeting(Request $request): array
    {
        return $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'meeting_time' => ['nullable'],
            'status'       => ['nullable', 'in:scheduled,completed,cancelled'],
            'invitee_ids'  => ['array'],
            'invitee_ids.*' => ['exists:users,id'],
        ]);
    }
}
