<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeetingSetting extends Model
{
    protected $fillable = ['enabled', 'weekday', 'weeks', 'meeting_time', 'reminder_offsets', 'invite_all', 'invitee_ids'];

    protected $casts = [
        'enabled'          => 'boolean',
        'weekday'          => 'integer',
        'weeks'            => 'array',
        'reminder_offsets' => 'array',
        'invite_all'       => 'boolean',
        'invitee_ids'      => 'array',
    ];

    /** Singleton config row (creates defaults if missing). */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'enabled' => true, 'weekday' => 1, 'weeks' => [1, 3],
            'meeting_time' => '11:00', 'reminder_offsets' => [2, 1], 'invite_all' => true, 'invitee_ids' => [],
        ]);
    }
}
