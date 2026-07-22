<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Global master switches for task/meeting mail + in-app notifications.
        Schema::create('notification_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('task_create_mail')->default(true);
            $table->boolean('task_status_mail')->default(true);
            $table->boolean('task_create_notify')->default(true);
            $table->boolean('task_status_notify')->default(true);
            $table->boolean('meeting_mail')->default(true);
            $table->boolean('meeting_notify')->default(true);
            $table->timestamps();
        });

        DB::table('notification_settings')->insert([
            'task_create_mail' => true, 'task_status_mail' => true,
            'task_create_notify' => true, 'task_status_notify' => true,
            'meeting_mail' => true, 'meeting_notify' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
