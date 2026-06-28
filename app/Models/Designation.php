<?php

namespace App\Models;

use App\Models\Concerns\HasStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Designation extends Model
{
    use HasStatus;

    protected $fillable = ['name', 'status'];

    protected $casts = ['status' => 'integer'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
