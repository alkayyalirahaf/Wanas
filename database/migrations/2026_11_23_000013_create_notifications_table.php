<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->string('type', 50)->nullable();
            $table->text('message');
            $table->string('link', 255)->nullable();
            $table->boolean('isRead')->default(false);
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};