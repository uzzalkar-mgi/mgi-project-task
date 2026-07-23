<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskWorkLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkLogController extends Controller
{
    /** Anyone on the task (reporter/assignee/watcher/super) posts a daily work entry. */
    public function store(Request $request, Task $task): RedirectResponse
    {
        $user = $request->user();
        abort_unless(Project::query()->visibleTo($user)->whereKey($task->project_id)->exists(), 403);

        $task->loadMissing(['assignees:id', 'watchers:id']);
        $onTask = $user->isSuperAdmin()
            || $task->reporter_id === $user->id
            || $task->assignees->contains('id', $user->id)
            || $task->watchers->contains('id', $user->id);
        abort_unless($onTask, 403);

        $data = $request->validate([
            'work_date' => ['required', 'date'],
            'hours'     => ['nullable', 'numeric', 'min:0', 'max:24'],
            'body'      => ['required', 'string', 'max:20000'],
        ]);

        TaskWorkLog::create([
            'task_id'   => $task->id,
            'user_id'   => $user->id,
            'work_date' => $data['work_date'],
            'hours'     => $data['hours'] ?? null,
            'body'      => $data['body'],
        ]);

        \App\Models\Activity::record($task, 'logged', 'logged '.($data['hours'] ? $data['hours'].'h ' : '').'work for '.$data['work_date']);

        return back()->with('status', 'Work log added.');
    }

    /** Delete own entry (or super-admin). */
    public function destroy(Request $request, TaskWorkLog $worklog): RedirectResponse
    {
        abort_unless($worklog->user_id === $request->user()->id || $request->user()->isSuperAdmin(), 403);
        $worklog->delete();

        return back()->with('status', 'Work log deleted.');
    }
}
