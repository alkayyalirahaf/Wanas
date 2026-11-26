<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->unsignedInteger('groupId');
            $table->enum('status', ['Pending', 'Active', 'Rejected'])->default('Pending');
            $table->text('requestMessage')->nullable();
            $table->timestamp('joinedAt')->useCurrent();
            $table->timestamps();
            $table->unique(['userId', 'groupId']);
            $table->foreign('userId')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('groupId')->references('id')->on('groups')->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};