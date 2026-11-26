<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bookingId');
            $table->integer('rating')->nullable();
            $table->text('comment')->nullable();
            $table->foreign('bookingId')->references('id')->on('bookings')->cascadeOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};