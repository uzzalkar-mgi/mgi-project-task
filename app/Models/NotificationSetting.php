<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'task_create_mail', 'task_status_mail', 'task_create_notify', 'task_status_notify',
        'meeting_mail', 'meeting_notify',
    ];

    protected $casts = [
        'task_create_mail'   => 'boolean',
        'task_status_mail'   => 'boolean',
        'task_create_notify' => 'boolean',
        'task_status_notify' => 'boolean',
        'meeting_mail'       => 'boolean',
        'meeting_notify'     => 'boolean',
    ];

    /** Singleton config row. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'task_create_mail' => true, 'task_status_mail' => true,
            'task_create_notify' => true, 'task_status_notify' => true,
            'meeting_mail' => true, 'meeting_notify' => true,
        ]);
    }
}
