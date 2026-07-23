<?php

namespace App\Http\Controllers;

use App\Models\SavedFilter;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyWorkController extends Controller
{
    /** Personal cross-project work view: tasks assigned to the current user. */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $tasks = Task::whereHas('assignees', fn ($a) => $a->where('users.id', $user->id))
            ->with('project:id,uuid,name')
            ->orderByRaw('due_date is null, due_date asc')
            ->get()
            ->map(fn (Task $t) => [
                'uuid'      => $t->uuid,
                'task_no'   => $t->task_no,
                'title'     => $t->title,
                'project'   => $t->project?->name,
                'project_uuid' => $t->project?->uuid,
                'status'    => $t->status,
                'priority'  => $t->priority,
                'due_date'  => $t->due_date?->toDateString(),
            ]);

        return Inertia::render('MyWork/Index', [
            'tasks'   => $tasks,
            'filters' => SavedFilter::where('user_id', $user->id)->latest()->get(['id', 'name', 'criteria']),
        ]);
    }

    public function storeFilter(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:60'],
            'criteria' => ['required', 'array'],
        ]);

        SavedFilter::create([
            'user_id'  => $request->user()->id,
            'name'     => $data['name'],
            'criteria' => $data['criteria'],
        ]);

        return back()->with('status', 'Filter saved.');
    }

    public function destroyFilter(Request $request, SavedFilter $filter): RedirectResponse
    {
        abort_unless($filter->user_id === $request->user()->id, 403);
        $filter->delete();

        return back()->with('status', 'Filter removed.');
    }
}
