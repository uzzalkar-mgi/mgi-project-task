<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Audit log: every create/update/delete (PRD §7 Audit Logging).
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type');                 // morph type, e.g. App\Models\Task
            $table->unsignedBigInteger('entity_id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // actor
            $table->string('action');                      // create | update | delete
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamp('created_at')->nullable()->index();

            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
