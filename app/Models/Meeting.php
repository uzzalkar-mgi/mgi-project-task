<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Meeting extends Model
{
    use HasUuids, SoftDeletes;

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'title', 'meeting_date', 'meeting_time', 'slot', 'status',
        'discussion', 'reminder_sent_at', 'created_by',
    ];

    protected $casts = [
        'meeting_date'     => 'date',
        'reminder_sent_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** All invited users. */
    public function invitees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'meeting_user')
            ->withPivot('attended', 'attended_at');
    }

    /** Invitees who actually attended. */
    public function attendees(): BelongsToMany
    {
        return $this->invitees()->wherePivot('attended', true);
    }

    /** The Saturday before the meeting — when the reminder should go out. */
    public function reminderDate(): \Illuminate\Support\Carbon
    {
        return $this->meeting_date->copy()->previous(\Carbon\Carbon::SATURDAY);
    }
}
