<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Multiple file/image upload per project (mgi-connect feed_images pattern).
        Schema::create('project_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('attachment_id')->constrained('attachments')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['project_id', 'attachment_id']);
        });

        // Multiple file/image upload per task.
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('attachment_id')->constrained('attachments')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['task_id', 'attachment_id']);
        });

        // Comment attachments (PRD: attachments in task notes/comments).
        Schema::create('comment_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('comments')->cascadeOnDelete();
            $table->foreignId('attachment_id')->constrained('attachments')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['comment_id', 'attachment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_attachments');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('project_attachments');
    }
};
