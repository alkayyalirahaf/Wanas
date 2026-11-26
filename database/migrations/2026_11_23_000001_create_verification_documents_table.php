<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('verification_documents', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->enum('documentType', ['license', 'id_card']);
            $table->string('fileUrl', 255);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('verification_documents'); }
};