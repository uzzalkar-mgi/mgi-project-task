<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('reporter_id')->constrained('users')->nullOnDelete();
        });

        // Backfill from the existing reporter (who created the task historically).
        DB::statement('UPDATE tasks SET created_by = reporter_id WHERE created_by IS NULL');
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
