<?php

namespace App\Models;

use App\Models\Concerns\HasStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasStatus;

    protected $fillable = ['name', 'code', 'is_super', 'status'];

    protected $casts = [
        'status'   => 'integer',
        'is_super' => 'boolean',
    ];

    /** Users holding this role (many-to-many via user_roles). */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles');
    }

    /** Permissions granted to this role. */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }
}
