<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Date-wise daily work log for multi-day tasks.
        Schema::create('task_work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('work_date');
            $table->decimal('hours', 5, 2)->nullable();
            $table->longText('body');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['task_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_work_logs');
    }
};
