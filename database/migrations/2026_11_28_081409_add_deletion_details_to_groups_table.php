<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->text('deletionReason')->nullable();
            $table->unsignedInteger('deletedBy')->nullable();

            $table->foreign('deletedBy')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['deletedBy']);
            $table->dropColumn(['deletionReason', 'deletedBy']);
        });
    }
};