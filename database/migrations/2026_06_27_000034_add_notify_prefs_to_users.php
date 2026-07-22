<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-user opt-out preferences (default on).
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_task_create_mail')->default(true);
            $table->boolean('notify_task_status_mail')->default(true);
            $table->boolean('notify_task_create_app')->default(true);
            $table->boolean('notify_task_status_app')->default(true);
            $table->boolean('notify_meeting_mail')->default(true);
            $table->boolean('notify_meeting_app')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'notify_task_create_mail', 'notify_task_status_mail',
                'notify_task_create_app', 'notify_task_status_app',
                'notify_meeting_mail', 'notify_meeting_app',
            ]);
        });
    }
};
