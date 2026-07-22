<?php

namespace App\Http\Controllers;

use App\Models\NotificationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationSettingController extends Controller
{
    public function edit(): Response
    {
        $this->authorize('permission', 'users.manage');

        return Inertia::render('Settings/Notifications', [
            'settings' => NotificationSetting::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorize('permission', 'users.manage');

        $data = $request->validate([
            'task_create_mail'   => ['boolean'],
            'task_status_mail'   => ['boolean'],
            'task_create_notify' => ['boolean'],
            'task_status_notify' => ['boolean'],
            'meeting_mail'       => ['boolean'],
            'meeting_notify'     => ['boolean'],
        ]);

        NotificationSetting::current()->update($data);

        return back()->with('status', 'Notification settings updated.');
    }
}
