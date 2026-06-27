@component('mail::message')
# ⚠️ Task Overdue

The following task has passed its due date and is not yet completed.

**Task:** {{ $task->title }}
**Project:** {{ $project ?? '—' }}
**Due Date:** {{ $dueDate ?? '—' }}
**Status:** {{ ucwords(str_replace('_', ' ', $task->status)) }}
**Priority:** {{ ucfirst($task->priority) }}

---

**Description**

{{ $description }}

@component('mail::button', ['url' => config('app.url').'/tasks'])
View Tasks
@endcomponent

This is an automated reminder from {{ config('app.name') }}.
@endcomponent
