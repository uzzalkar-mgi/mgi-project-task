<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\HasStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;

#[Fillable(['name', 'email', 'employee_id', 'office_contact', 'image_id', 'role_id', 'department_id', 'designation_id', 'password', 'status', 'notify_task_create_mail', 'notify_task_status_mail', 'notify_task_create_app', 'notify_task_status_app', 'notify_meeting_mail', 'notify_meeting_app'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasStatus, HasUuids, Notifiable, SoftDeletes;

    /** Generate a UUID for the `uuid` column (keeps the bigint `id` as primary key). */
    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    /** Bind route {user} by uuid for browser-facing URLs (id stays PK). */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /** Expose avatar URL to the frontend (null when no avatar set). */
    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar?->url;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'status'            => 'integer',
            'role_id'           => 'integer',
            'notify_task_create_mail' => 'boolean',
            'notify_task_status_mail' => 'boolean',
            'notify_task_create_app'  => 'boolean',
            'notify_task_status_app'  => 'boolean',
            'notify_meeting_mail'     => 'boolean',
            'notify_meeting_app'      => 'boolean',
        ];
    }

    // ---- Relationships ---------------------------------------------------

    /** Legacy single role (kept for the old role_id column / display). */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** All roles assigned to this user (many-to-many). */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function avatar(): BelongsTo
    {
        return $this->belongsTo(Attachment::class, 'image_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    /** Projects led by this user. */
    public function ledProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'lead_user_id');
    }

    /** Projects where this user is members (many-to-many). */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot('role_in_project')
            ->withTimestamps();
    }

    /** Tasks assigned to this user. */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user');
    }

    // ---- Permission resolution ------------------------------------------

    public function isSuperAdmin(): bool
    {
        return $this->roles->contains(fn (Role $r) => $r->is_super);
    }

    /** Flat, de-duplicated permission names (union of all roles). Cached per user. */
    public function permissionNames(): array
    {
        return Cache::remember("user.{$this->id}.permissions", 600, function () {
            $this->loadMissing('roles.permissions');

            if ($this->isSuperAdmin()) {
                return ['*'];
            }

            return $this->roles
                ->flatMap(fn (Role $r) => $r->permissions->pluck('name'))
                ->unique()
                ->values()
                ->all();
        });
    }

    public function hasPermission(string $name): bool
    {
        $perms = $this->permissionNames();

        return in_array('*', $perms, true) || in_array($name, $perms, true);
    }

    public function hasRole(string $code): bool
    {
        return $this->roles->contains(fn (Role $r) => $r->code === $code || $r->name === $code);
    }

    public function flushPermissionCache(): void
    {
        Cache::forget("user.{$this->id}.permissions");
    }
}
