<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasUuids, SoftDeletes;

    /** UUID lives in `uuid`; bigint `id` stays primary key. */
    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    /** Route-model binding by uuid for browser-facing URLs. */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected $fillable = [
        'name', 'description', 'start_date', 'end_date', 'priority', 'status',
        'lead_user_id', 'primary_responsible_id', 'secondary_responsible_id', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    /**
     * Scope to projects the user may access.
     * Super-admin sees all; everyone else (incl. Managers) sees only projects
     * they lead, are responsible for, or are a member of.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $w) use ($user) {
            $w->where('lead_user_id', $user->id)
                ->orWhere('created_by', $user->id)
                ->orWhere('primary_responsible_id', $user->id)
                ->orWhere('secondary_responsible_id', $user->id)
                ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id))
                ->orWhereHas('tasks', fn ($t) => $t->whereHas('assignees', fn ($a) => $a->where('users.id', $user->id)));
        });
    }

    // ---- Accountability chain (PRD §9.2) --------------------------------

    public function lead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_user_id');
    }

    public function primaryResponsible(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_responsible_id');
    }

    public function secondaryResponsible(): BelongsTo
    {
        return $this->belongsTo(User::class, 'secondary_responsible_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ---- Relationships ---------------------------------------------------

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role_in_project')
            ->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class);
    }

    public function attachments(): BelongsToMany
    {
        return $this->belongsToMany(Attachment::class, 'project_attachments')->withTimestamps();
    }

    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
