<?php

use App\Http\Controllers\AnswerController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationSettingController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TimelineController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

// Public, read-only task view — shareable link (by task number), no login required.
Route::get('/shared/tasks/{task:task_no}', [TaskController::class, 'publicShow'])->name('tasks.public');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->middleware('perm:projects.menu')->name('projects.index');
    Route::get('/projects/create', [ProjectController::class, 'create'])->middleware('perm:projects.menu')->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->middleware('perm:projects.menu')->name('projects.edit');
    Route::patch('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('perm:projects.menu')->name('projects.show');

    Route::get('/tasks', [TaskController::class, 'index'])->middleware('perm:tasks.menu')->name('tasks.index');
    Route::get('/tasks/create', [TaskController::class, 'create'])->middleware('perm:tasks.menu')->name('tasks.create');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('/tasks/{task}/edit', [TaskController::class, 'edit'])->middleware('perm:tasks.menu')->name('tasks.edit');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->middleware('perm:tasks.menu')->name('tasks.show');
    Route::get('/tasks/{task}/comments', [TaskController::class, 'comments'])->name('tasks.comments');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
    Route::patch('/tasks/{task}/watchers', [TaskController::class, 'updateWatchers'])->name('tasks.watchers');
    Route::post('/tasks/{task}/attachments', [TaskController::class, 'uploadAttachment'])->name('tasks.attachments.store');
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Dedicated task answers (assignee deliverables).
    Route::post('/tasks/{task}/answers', [AnswerController::class, 'store'])->name('answers.store');
    Route::patch('/answers/{answer}/accept', [AnswerController::class, 'accept'])->name('answers.accept');
    Route::delete('/answers/{answer}', [AnswerController::class, 'destroy'])->name('answers.destroy');

    // Daily work log.
    Route::post('/tasks/{task}/worklogs', [WorkLogController::class, 'store'])->name('worklogs.store');
    Route::delete('/worklogs/{worklog}', [WorkLogController::class, 'destroy'])->name('worklogs.destroy');

    // Reports.
    Route::get('/reports/employees', [ReportController::class, 'employees'])->middleware('perm:reports.menu')->name('reports.employees');
    Route::get('/reports/tasks', [ReportController::class, 'tasks'])->middleware('perm:reports.menu')->name('reports.tasks');
    Route::get('/reports/tasks/export', [ReportController::class, 'export'])->middleware('perm:reports.menu')->name('reports.tasks.export');

    Route::get('/timeline', [TimelineController::class, 'index'])->middleware('perm:timeline.menu')->name('timeline.index');
    Route::get('/milestones', [MilestoneController::class, 'index'])->middleware('perm:milestones.menu')->name('milestones.index');

    // Monthly meetings.
    Route::get('/meeting-settings', [MeetingController::class, 'settings'])->middleware('perm:meetings.menu')->name('meetings.settings');
    Route::patch('/meeting-settings', [MeetingController::class, 'updateSettings'])->name('meetings.settings.update');
    Route::get('/meetings', [MeetingController::class, 'index'])->middleware('perm:meetings.menu')->name('meetings.index');
    Route::get('/meetings/create', [MeetingController::class, 'create'])->middleware('perm:meetings.menu')->name('meetings.create');
    Route::post('/meetings', [MeetingController::class, 'store'])->name('meetings.store');
    Route::get('/meetings/{meeting}/edit', [MeetingController::class, 'edit'])->middleware('perm:meetings.menu')->name('meetings.edit');
    Route::patch('/meetings/{meeting}', [MeetingController::class, 'update'])->name('meetings.update');
    Route::get('/meetings/{meeting}', [MeetingController::class, 'show'])->middleware('perm:meetings.menu')->name('meetings.show');
    Route::patch('/meetings/{meeting}/discussion', [MeetingController::class, 'saveDiscussion'])->name('meetings.discussion');
    Route::patch('/meetings/{meeting}/attendance', [MeetingController::class, 'markAttendance'])->name('meetings.attendance');
    Route::delete('/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('meetings.destroy');

    Route::get('/attachments/{attachment}', [AttachmentController::class, 'show'])->name('attachments.show');

    Route::patch('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.readAll');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

    // Team / user administration.
    Route::get('/users', [UserController::class, 'index'])->middleware('perm:users.menu')->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->middleware('perm:users.menu')->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('perm:users.menu')->name('users.show');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->middleware('perm:users.menu')->name('users.edit');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/status', [UserController::class, 'toggleStatus'])->name('users.status');

    // Roles & permissions.
    Route::get('/roles', [RoleController::class, 'index'])->middleware('perm:roles.menu')->name('roles.index');
    Route::get('/roles/create', [RoleController::class, 'create'])->middleware('perm:roles.menu')->name('roles.create');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->middleware('perm:roles.menu')->name('roles.edit');
    Route::patch('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::patch('/roles/{role}/status', [RoleController::class, 'toggleStatus'])->name('roles.status');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // Settings: Departments.
    Route::get('/departments', [DepartmentController::class, 'index'])->middleware('perm:departments.menu')->name('departments.index');
    Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
    Route::patch('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
    Route::patch('/departments/{department}/status', [DepartmentController::class, 'toggleStatus'])->name('departments.status');
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');

    // Settings: Mail & Notifications (global, admin).
    Route::get('/notification-settings', [NotificationSettingController::class, 'edit'])->middleware('perm:users.menu')->name('notifications.settings');
    Route::patch('/notification-settings', [NotificationSettingController::class, 'update'])->name('notifications.settings.update');

    // Settings: Designations.
    Route::get('/designations', [DesignationController::class, 'index'])->middleware('perm:designations.menu')->name('designations.index');
    Route::post('/designations', [DesignationController::class, 'store'])->name('designations.store');
    Route::patch('/designations/{designation}', [DesignationController::class, 'update'])->name('designations.update');
    Route::patch('/designations/{designation}/status', [DesignationController::class, 'toggleStatus'])->name('designations.status');
    Route::delete('/designations/{designation}', [DesignationController::class, 'destroy'])->name('designations.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/notifications', [ProfileController::class, 'updateNotifications'])->name('profile.notifications');
    Route::post('/profile/image', [ProfileController::class, 'updateImage'])->name('profile.image');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
