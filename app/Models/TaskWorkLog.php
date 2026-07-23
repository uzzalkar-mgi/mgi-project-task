<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskWorkLog extends Model
{
    use SoftDeletes;

    protected $fillable = ['task_id', 'user_id', 'work_date', 'hours', 'body'];

    protected $casts = [
        'work_date' => 'date',
        'hours'     => 'decimal:2',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
