<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Permissions catalogue.
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();              // e.g. projects.create, tasks.assign
            $table->string('module')->index();             // grouping key: projects, tasks, users...
            $table->string('action');                      // menu | view | create | update | delete | assign
            $table->string('guard')->default('backend');   // backend | frontend | both
            $table->string('label')->nullable();
            $table->timestamps();
        });

        // Role <-> Permission.
        Schema::create('role_permission', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        // User <-> Role (multiple roles per user).
        Schema::create('user_roles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->primary(['user_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permission');
        Schema::dropIfExists('permissions');
    }
};
