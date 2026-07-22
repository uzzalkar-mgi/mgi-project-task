<?php

use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('task_no', 10)->nullable()->unique()->after('uuid');
        });

        // Backfill existing tasks with a unique 10-digit number.
        Task::withTrashed()->whereNull('task_no')->get()->each(function (Task $task) {
            $task->forceFill(['task_no' => Task::generateTaskNo()])->saveQuietly();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('task_no');
        });
    }
};
