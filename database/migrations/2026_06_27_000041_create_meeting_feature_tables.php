<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agenda items — structured topics for a meeting.
        Schema::create('meeting_agenda_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->string('title');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('minutes')->nullable();   // time-box
            $table->unsignedInteger('position')->default(0);
            $table->boolean('done')->default(false);
            $table->timestamp('done_at')->nullable();
            $table->timestamps();
            $table->index(['meeting_id', 'position']);
        });

        // Pre-meeting submissions — points invitees add ahead of time.
        Schema::create('meeting_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        // Files attached to a meeting (reuses the central attachments table).
        Schema::create('meeting_attachments', function (Blueprint $table) {
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('attachment_id')->constrained('attachments')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['meeting_id', 'attachment_id']);
        });

        // Action items — become trackable tasks; unfinished ones carry forward.
        Schema::create('meeting_action_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->string('title');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->enum('status', ['open', 'done'])->default('open');
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->foreignId('carried_from_meeting_id')->nullable()->constrained('meetings')->nullOnDelete();
            $table->timestamps();
            $table->index(['meeting_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_action_items');
        Schema::dropIfExists('meeting_attachments');
        Schema::dropIfExists('meeting_submissions');
        Schema::dropIfExists('meeting_agenda_items');
    }
};
