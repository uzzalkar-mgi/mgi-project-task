<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();                // browser-facing id (bigint id stays PK)
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['active', 'on_hold', 'completed', 'cancelled'])->default('active');

            // Accountability chain (PRD §9.2).
            $table->foreignId('lead_user_id')->constrained('users')->restrictOnDelete();             // project lead, required
            $table->foreignId('primary_responsible_id')->constrained('users')->restrictOnDelete();   // required
            $table->foreignId('secondary_responsible_id')->nullable()->constrained('users')->nullOnDelete(); // backup
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();                         // 90-day recovery window
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
