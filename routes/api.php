<?php

use App\Http\Controllers\ImageController;
use Illuminate\Support\Facades\Route;

// Image upload to Google Cloud Storage.
// NOTE: currently unauthenticated for testing — add ->middleware('auth:sanctum')
// (or a token guard) before exposing in production.
Route::post('/images/upload', [ImageController::class, 'upload'])->name('api.images.upload');
Route::delete('/images', [ImageController::class, 'destroy'])->name('api.images.destroy');
Route::get('/images/show', [ImageController::class, 'show'])->name('api.images.show');

// Token-authenticated API (personal access tokens created in Profile → API Access).
// Send header: Authorization: Bearer <token>
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (\Illuminate\Http\Request $r) => $r->user()->only(['uuid', 'name', 'email', 'employee_id']))->name('api.user');
    Route::get('/my/tasks', function (\Illuminate\Http\Request $r) {
        return \App\Models\Task::whereHas('assignees', fn ($a) => $a->where('users.id', $r->user()->id))
            ->with('project:id,name')
            ->orderByRaw('due_date is null, due_date asc')
            ->get(['uuid', 'task_no', 'title', 'status', 'priority', 'due_date', 'project_id']);
    })->name('api.my.tasks');
});
