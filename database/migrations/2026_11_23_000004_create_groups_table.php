<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('ownerId');
            $table->string('title', 150);
            $table->string('topic', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('coverImageUrl', 255)->nullable();
            $table->boolean('isPrivate')->default(false);
            $table->enum('status', ['Active', 'Archived'])->default('Active');
            $table->timestamps();
            $table->foreign('ownerId')->references('id')->on('users')->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};