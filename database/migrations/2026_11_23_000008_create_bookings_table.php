<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->unsignedInteger('specialistId');
            $table->unsignedInteger('slotId');
            $table->dateTime('startsAt');
            $table->dateTime('endsAt');
            $table->decimal('amount', 10, 2);
            $table->decimal('platformCommission', 10, 2)->nullable();
            $table->decimal('providerAmount', 10, 2)->nullable();
            $table->enum('status', ['Pending', 'Confirmed', 'Canceled', 'Completed', 'Refunded'])->default('Pending');
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('specialistId')->references('id')->on('specialists')->cascadeOnDelete();
            $table->foreign('slotId')->references('id')->on('specialist_slots')->cascadeOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};