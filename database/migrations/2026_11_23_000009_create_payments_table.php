<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bookingId');
            $table->string('stripePaymentIntentId', 255)->nullable()->unique();
            $table->decimal('amount', 10, 2);
            $table->decimal('platformFee', 10, 2)->nullable();
            $table->enum('status', ['succeeded', 'failed', 'refunded']);
            $table->foreign('bookingId')->references('id')->on('bookings')->cascadeOnDelete();
            $table->timestamps();

            });
    }
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};