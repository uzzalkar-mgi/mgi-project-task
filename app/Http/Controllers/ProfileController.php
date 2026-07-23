<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Attachment;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user()->load([
            'department:id,name', 'designation:id,name',
            'ledProjects:id,uuid,name,status,priority,end_date',
            'projects:id,uuid,name,status',
            'tasks' => fn ($q) => $q->with(['project:id,name', 'reporter:id,uuid,name'])->orderBy('due_date'),
        ]);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => session('status'),
            'notifyPrefs'     => [
                'notify_task_create_mail' => (bool) $user->notify_task_create_mail,
                'notify_task_status_mail' => (bool) $user->notify_task_status_mail,
                'notify_task_create_app'  => (bool) $user->notify_task_create_app,
                'notify_task_status_app'  => (bool) $user->notify_task_status_app,
                'notify_meeting_mail'     => (bool) $user->notify_meeting_mail,
                'notify_meeting_app'      => (bool) $user->notify_meeting_app,
            ],
            'department'      => $user->department?->name,
            'designation'     => $user->designation?->name,
            'departments'     => \App\Models\Department::active()->orderBy('name')->get(['id', 'name']),
            'designations'    => \App\Models\Designation::active()->orderBy('name')->get(['id', 'name']),
            'ledProjects'     => $user->ledProjects->map(fn ($p) => [
                'uuid' => $p->uuid, 'name' => $p->name, 'status' => $p->status, 'priority' => $p->priority,
            ]),
            'memberProjects'  => \App\Models\Project::visibleTo($user)->orderBy('name')->get(['uuid', 'name', 'status'])->map(fn ($p) => [
                'uuid' => $p->uuid, 'name' => $p->name, 'status' => $p->status,
            ]),
            'tasks'           => $user->tasks->map(fn ($t) => [
                'uuid' => $t->uuid, 'title' => $t->title, 'project' => $t->project?->name,
                'status' => $t->status, 'priority' => $t->priority, 'due_date' => $t->due_date?->toDateString(),
                'created_by' => $t->reporter?->name,
                'created_by_uuid' => $t->reporter?->uuid,
            ]),
            'createdTasks'    => \App\Models\Task::where('reporter_id', $user->id)
                ->with('project:id,uuid,name')
                ->orderBy('due_date')
                ->get()
                ->groupBy(fn ($t) => $t->project?->name ?? 'No project')
                ->map(fn ($group, $name) => [
                    'project'      => $name,
                    'project_uuid' => $group->first()->project?->uuid,
                    'tasks'        => $group->map(fn ($t) => [
                        'uuid' => $t->uuid, 'title' => $t->title, 'status' => $t->status,
                        'priority' => $t->priority, 'due_date' => $t->due_date?->toDateString(),
                    ])->values(),
                ])->values(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /** Update the user's own notification preferences (opt-out toggles). */
    public function updateNotifications(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'notify_task_create_mail' => ['boolean'],
            'notify_task_status_mail' => ['boolean'],
            'notify_task_create_app'  => ['boolean'],
            'notify_task_status_app'  => ['boolean'],
            'notify_meeting_mail'     => ['boolean'],
            'notify_meeting_app'      => ['boolean'],
        ]);

        $request->user()->forceFill($data)->save();

        return Redirect::route('profile.edit')->with('status', 'Notification preferences updated.');
    }

    /**
     * Update the user's avatar. Stores the file, records an Attachment,
     * points users.image_id at it (mgi-connect images-table pattern).
     */
    public function updateImage(Request $request): RedirectResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        $path = $request->file('image')->store('avatars', 'public');

        $attachment = Attachment::create([
            'title'       => $request->file('image')->getClientOriginalName(),
            'url'         => Storage::disk('public')->url($path),
            'size'        => $request->file('image')->getSize(),
            'file_type'   => $request->file('image')->getMimeType(),
            'type'        => 'avatar',
            'uploaded_by' => $user->id,
            'status'      => 1,
        ]);

        $user->image_id = $attachment->id;
        $user->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
