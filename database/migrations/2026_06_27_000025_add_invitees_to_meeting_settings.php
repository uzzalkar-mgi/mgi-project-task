<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meeting_settings', function (Blueprint $table) {
            $table->json('invitee_ids')->default('[]')->after('invite_all');
        });
    }

    public function down(): void
    {
        Schema::table('meeting_settings', function (Blueprint $table) {
            $table->dropColumn('invitee_ids');
        });
    }
};
