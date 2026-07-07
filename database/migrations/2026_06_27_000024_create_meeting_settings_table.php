<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(true);          // auto-generate on/off
            $table->tinyInteger('weekday')->default(1);         // 0=Sun … 6=Sat (1=Monday)
            $table->json('weeks')->default('[1,3]');            // which weeks of month
            $table->time('meeting_time')->default('11:00');
            $table->json('reminder_offsets')->default('[2,1]'); // days before meeting to remind (Sat & Sun)
            $table->boolean('invite_all')->default(true);       // auto-invite all active users
            $table->timestamps();
        });

        DB::table('meeting_settings')->insert([
            'enabled' => true, 'weekday' => 1, 'weeks' => '[1,3]',
            'meeting_time' => '11:00', 'reminder_offsets' => '[2,1]', 'invite_all' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_settings');
    }
};
