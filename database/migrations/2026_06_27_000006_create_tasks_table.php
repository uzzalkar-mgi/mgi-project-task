<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();                // browser-facing id (bigint id stays PK)
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('parent_task_id')->nullable()->constrained('tasks')->nullOnDelete(); // sub-tasks
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('reporter_id')->nullable()->constrained('users')->nullOnDelete();    // creator
            $table->date('start_date')->nullable();        // Gantt bar start
            $table->date('due_date');
            $table->enum('priority', ['urgent', 'high', 'normal', 'low'])->default('normal');
            $table->enum('status', ['todo', 'in_progress', 'under_review', 'done', 'blocked'])->default('todo');
            $table->decimal('estimated_hours', 6, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
