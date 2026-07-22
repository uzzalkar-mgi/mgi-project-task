<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dedicated answers/deliverables an assignee posts against a task.
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // author (assignee)
            $table->longText('body');
            $table->boolean('is_accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('answer_attachments', function (Blueprint $table) {
            $table->foreignId('answer_id')->constrained('answers')->cascadeOnDelete();
            $table->foreignId('attachment_id')->constrained('attachments')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['answer_id', 'attachment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_attachments');
        Schema::dropIfExists('answers');
    }
};
