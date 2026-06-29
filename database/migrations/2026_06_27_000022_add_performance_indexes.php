<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->index('status');        // status breakdown / board grouping
            $table->index('due_date');      // overdue + countdown queries
            $table->index('reporter_id');   // "created by" lookups
            $table->index('parent_task_id'); // sub-task lookups
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index('task_id');       // comment counts / threads per task
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['reporter_id']);
            $table->dropIndex(['parent_task_id']);
        });
        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['task_id']);
        });
    }
};
