<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnswerController extends Controller
{
    /** An assignee posts an answer/deliverable against a task (rich text + files). */
    public function store(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        abort_unless(Project::query()->visibleTo($user)->whereKey($task->project_id)->exists(), 403);

        // Only assignees (or super-admin) may answer.
        $task->loadMissing('assignees:id');
        abort_unless($user->isSuperAdmin() || $task->assignees->contains('id', $user->id), 403);

        $data = $request->validate([
            'body'          => ['required', 'string', 'max:20000'],
            'files'         => ['array', 'max:5'],
            'files.*'       => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip'],
            'mention_ids'   => ['array'],
            'mention_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $answer = Answer::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body'    => $data['body'],
        ]);

        foreach ($request->file('files', []) as $file) {
            $path = $file->store('answer-attachments', 'public');
            $attachment = Attachment::create([
                'title'       => $file->getClientOriginalName(),
                'url'         => Storage::disk('public')->url($path),
                'size'        => $file->getSize(),
                'file_type'   => $file->getMimeType(),
                'type'        => 'answer',
                'uploaded_by' => $user->id,
                'status'      => 1,
            ]);
            $answer->attachments()->attach($attachment->id);
        }

        // @mentions — notify (skip self).
        collect($data['mention_ids'] ?? [])->unique()->reject(fn ($id) => (int) $id === $user->id)
            ->each(fn ($mid) => \App\Models\AppNotification::create([
                'user_id' => $mid,
                'type'    => 'mention',
                'message' => "{$user->name} mentioned you in an answer on \"{$task->title}\"",
                'data'    => ['task_uuid' => $task->uuid, 'link' => '/tasks/'.$task->uuid],
                'is_read' => false,
            ]));

        \App\Models\Activity::record($task, 'answered', 'posted an answer');

        return back()->with('status', 'Answer posted.');
    }

    /** Task owner/manager marks one answer as the accepted one (single accepted per task). */
    public function accept(Request $request, Answer $answer): RedirectResponse
    {
        $user = $request->user();
        $task = $answer->task;
        abort_unless(Project::query()->visibleTo($user)->whereKey($task->project_id)->exists(), 403);
        abort_unless($this->canAccept($user, $task), 403);

        // Toggle: accepting one clears the rest.
        $makeAccepted = ! $answer->is_accepted;
        Answer::where('task_id', $task->id)->update(['is_accepted' => false, 'accepted_at' => null]);
        if ($makeAccepted) {
            $answer->update(['is_accepted' => true, 'accepted_at' => now()]);
        }

        return back()->with('status', $makeAccepted ? 'Answer accepted.' : 'Answer unaccepted.');
    }

    /** Delete own answer (or super-admin). */
    public function destroy(Request $request, Answer $answer): RedirectResponse
    {
        abort_unless($answer->user_id === $request->user()->id || $request->user()->isSuperAdmin(), 403);
        $answer->delete();

        return back()->with('status', 'Answer deleted.');
    }

    private function canAccept($user, Task $task): bool
    {
        $task->loadMissing('assignees:id');

        return $user->isSuperAdmin()
            || $user->hasPermission('tasks.assign')
            || $task->reporter_id === $user->id
            || $task->assignees->contains('id', $user->id);
    }
}
