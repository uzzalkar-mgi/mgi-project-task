<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();                 // browser-facing id (bigint id stays PK)
            $table->string('name');
            $table->string('email')->unique();
            $table->string('employee_id')->unique();
            $table->string('office_contact')->nullable()->unique();
            $table->foreignId('image_id')->nullable();      // avatar (FK added after attachments table)
            $table->foreignId('role_id')->index(); // legacy single role; user_roles pivot is source of truth
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->tinyInteger('status')->default(1);      // 1 = Active, 0 = Inactive
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();                          // PRD §7 soft-delete, 90-day recovery
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
