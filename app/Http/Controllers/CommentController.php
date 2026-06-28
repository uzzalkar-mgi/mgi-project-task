<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    /** Post a comment or reply on a task (with optional files/images). */
    public function store(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();

        // Only users who can access the task's project may comment.
        abort_unless(Project::query()->visibleTo($user)->whereKey($task->project_id)->exists(), 403);

        $data = $request->validate([
            'body'      => ['required', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'exists:comments,id'],
            'files'     => ['array', 'max:5'],
            'files.*'   => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
        ]);

        // A reply must belong to the same task.
        if (! empty($data['parent_id'])) {
            $parentOk = Comment::whereKey($data['parent_id'])->where('task_id', $task->id)->exists();
            abort_unless($parentOk, 422);
        }

        $comment = Comment::create([
            'task_id'   => $task->id,
            'user_id'   => $user->id,
            'parent_id' => $data['parent_id'] ?? null,
            'body'      => $data['body'],
        ]);

        foreach ($request->file('files', []) as $file) {
            $path = $file->store('comment-attachments', 'public');
            $attachment = Attachment::create([
                'title'       => $file->getClientOriginalName(),
                'url'         => Storage::disk('public')->url($path),
                'size'        => $file->getSize(),
                'file_type'   => $file->getMimeType(),
                'type'        => 'comment',
                'uploaded_by' => $user->id,
                'status'      => 1,
            ]);
            $comment->attachments()->attach($attachment->id);
        }

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back()->with('status', 'Comment posted.');
    }

    /** Delete own comment (or super-admin). */
    public function destroy(Request $request, Comment $comment): RedirectResponse|JsonResponse
    {
        abort_unless($comment->user_id === $request->user()->id || $request->user()->isSuperAdmin(), 403);
        $comment->delete();

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back()->with('status', 'Comment deleted.');
    }
}
