<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $fillable = ['task_id', 'user_id', 'parent_id', 'body'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    /** Users @mentioned in this comment. */
    public function mentions(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'comment_mentions', 'comment_id', 'mentioned_user_id');
    }

    public function attachments(): BelongsToMany
    {
        return $this->belongsToMany(Attachment::class, 'comment_attachments')->withTimestamps();
    }

    /**
     * Build the full nested comment tree for a task (unlimited reply depth).
     *
     * @return array<int, array<string, mixed>>
     */
    public static function treeForTask(Task $task): array
    {
        $userId  = auth()->id();
        $isSuper = auth()->user()?->isSuperAdmin() ?? false;

        // Fetch every comment for the task once, then nest in PHP (any depth).
        $all = static::where('task_id', $task->id)
            ->with(['author:id,name', 'attachments'])
            ->orderBy('created_at')
            ->get();

        $byParent = $all->groupBy(fn ($c) => $c->parent_id ?? 0);

        $build = function ($parentId) use (&$build, $byParent, $userId, $isSuper) {
            return $byParent->get($parentId, collect())->map(fn ($c) => [
                'id'          => $c->id,
                'body'        => $c->body,
                'author'      => $c->author?->name,
                'created_at'  => $c->created_at?->diffForHumans(),
                'can_delete'  => $isSuper || $c->user_id === $userId,
                'attachments' => $c->attachments->map(fn ($a) => [
                    'title' => $a->title, 'url' => route('attachments.show', $a->id), 'file_type' => $a->file_type,
                ])->all(),
                'replies'     => $build($c->id),
            ])->values()->all();
        };

        return $build(0);
    }
}
