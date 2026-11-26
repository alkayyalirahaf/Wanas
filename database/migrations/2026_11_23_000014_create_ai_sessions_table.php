<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_sessions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->json('userInput')->nullable();
            $table->json('recommendations')->nullable();
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('ai_sessions');
    }
};