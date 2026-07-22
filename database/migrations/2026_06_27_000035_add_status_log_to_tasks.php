<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Audit trail of status changes: parallel arrays of who + when.
        Schema::table('tasks', function (Blueprint $table) {
            $table->json('status_updated_by')->nullable()->after('status'); // [userId, ...]
            $table->json('status_updated_at')->nullable()->after('status_updated_by'); // [ISO datetime, ...]
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['status_updated_by', 'status_updated_at']);
        });
    }
};
