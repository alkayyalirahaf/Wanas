<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('reporterId');
            $table->enum('targetType', ['user', 'event', 'group']);
            $table->unsignedInteger('targetId');
            $table->string('category', 50)->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['Open', 'Resolved', 'Dismissed'])->default('Open');
            $table->foreign('reporterId')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();

        });
    }
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};