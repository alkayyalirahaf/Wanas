<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('groupId')->nullable();
            $table->unsignedInteger('hostId');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->enum('locationType', ['online', 'indoor', 'outdoor']);
            $table->string('locationDetails', 255);
            $table->integer('capacity');
            $table->dateTime('startsAt');
            $table->dateTime('endsAt');
            $table->string('coverImageUrl', 255)->nullable();
            $table->enum('status', ['Draft', 'Published', 'Canceled'])->default('Published');
            $table->timestamps();
            $table->foreign('groupId')->references('id')->on('groups')->nullOnDelete();
            $table->foreign('hostId')->references('id')->on('users')->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};