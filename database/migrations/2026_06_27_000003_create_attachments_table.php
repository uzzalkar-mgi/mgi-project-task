<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Central media table (generalises mgi-connect `images` to any file type).
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();           // original filename
            $table->string('url');                         // storage path / url
            $table->unsignedBigInteger('size')->nullable(); // bytes
            $table->string('file_type')->nullable();       // mime, e.g. application/pdf, image/png
            $table->string('type')->nullable();            // category: project, task, avatar
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
