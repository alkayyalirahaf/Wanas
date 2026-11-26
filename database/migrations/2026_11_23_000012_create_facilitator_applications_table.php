<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('facilitator_applications', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->unsignedInteger('reviewedBy')->nullable();
            $table->string('proposedTopic', 200)->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('reviewedBy')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('facilitator_applications');
    }
};