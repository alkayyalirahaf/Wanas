<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('specialist_slots', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('specialistId');
            $table->dateTime('startTime');
            $table->dateTime('endTime');
            $table->boolean('isBooked')->default(false);
            $table->timestamps();
            $table->foreign('specialistId')->references('id')->on('specialists')->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('specialist_slots');
    }
};