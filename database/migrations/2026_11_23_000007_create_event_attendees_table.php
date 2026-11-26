<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('event_attendees', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('eventId');
            $table->unsignedInteger('userId');
            $table->timestamp('joinedAt')->useCurrent();
            $table->unique(['eventId', 'userId']);
            $table->foreign('eventId')->references('id')->on('events')->cascadeOnDelete();
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('event_attendees'); }
};