<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasUuids, SoftDeletes;

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    protected static function booted(): void
    {
        static::creating(function (Task $task) {
            if (empty($task->task_no)) {
                $task->task_no = static::generateTaskNo();
            }
        });
    }

    /** Unique 10-digit task number (no leading zero). */
    public static function generateTaskNo(): string
    {
        do {
            $no = (string) random_int(1_000_000_000, 9_999_999_999);
        } while (static::withTrashed()->where('task_no', $no)->exists());

        return $no;
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'project_id', 'parent_task_id', 'title', 'description', 'reporter_id',
        'start_date', 'due_date', 'priority', 'status', 'platform', 'estimated_hours',
        'status_updated_by', 'status_updated_at',
    ];

    protected $casts = [
        'start_date'         => 'date',
        'due_date'           => 'date',
        'estimated_hours'    => 'decimal:2',
        'overdue_alerted_at' => 'datetime',
        'completed_at'       => 'datetime',
        'status_updated_by'  => 'array',
        'status_updated_at'  => 'array',
    ];

    /** Append a status-change entry (who + when) to the parallel audit arrays. */
    public function pushStatusLog(int $userId): void
    {
        $by = $this->status_updated_by ?? [];
        $at = $this->status_updated_at ?? [];
        $by[] = $userId;
        $at[] = now()->toIso8601String();
        $this->status_updated_by = $by;
        $this->status_updated_at = $at;
    }

    // ---- Relationships ---------------------------------------------------

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    /** Assignees (one or more). */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    /** Tagged watchers — extra users notified but not responsible. */
    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_watchers');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /** Dedicated answers/deliverables posted against this task. */
    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    /** Date-wise daily work log entries. */
    public function workLogs(): HasMany
    {
        return $this->hasMany(TaskWorkLog::class);
    }

    /** Tasks this task depends on. */
    public function dependencies(): HasMany
    {
        return $this->hasMany(TaskDependency::class, 'task_id');
    }

    public function attachments(): BelongsToMany
    {
        return $this->belongsToMany(Attachment::class, 'task_attachments')->withTimestamps();
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
