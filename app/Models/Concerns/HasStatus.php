<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Shared behaviour for the tinyint `status` column (1 = Active, 0 = Inactive).
 * Mirrors the mgi-connect-backend concern — single source of truth for status flags.
 */
trait HasStatus
{
    public const STATUS_INACTIVE = 0;
    public const STATUS_ACTIVE = 1;

    public static function statuses(): array
    {
        return [
            self::STATUS_ACTIVE   => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
        ];
    }

    public function getStatusLabelAttribute(): string
    {
        return self::statuses()[(int) $this->status] ?? 'Unknown';
    }

    public function isActive(): bool
    {
        return (int) $this->status === self::STATUS_ACTIVE;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function toggleStatus(): int
    {
        $this->status = $this->isActive() ? self::STATUS_INACTIVE : self::STATUS_ACTIVE;
        $this->save();

        return $this->status;
    }
}
