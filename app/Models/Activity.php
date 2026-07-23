<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Activity extends Model
{
    protected $table = 'activity_feed';

    protected $fillable = ['user_id', 'subject_type', 'subject_id', 'project_id', 'action', 'description', 'meta'];

    protected $casts = ['meta' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record an activity entry. Never throws — a logging failure must not
     * block the underlying action.
     */
    public static function record(Model $subject, string $action, ?string $description = null, array $meta = []): void
    {
        try {
            static::create([
                'user_id'      => auth()->id(),
                'subject_type' => $subject::class,
                'subject_id'   => $subject->getKey(),
                'project_id'   => $subject instanceof Task ? $subject->project_id : ($subject instanceof Project ? $subject->getKey() : null),
                'action'       => $action,
                'description'  => $description,
                'meta'         => $meta ?: null,
            ]);
        } catch (\Throwable $e) {
            // swallow — activity logging is best-effort
        }
    }
}
