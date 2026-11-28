
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('blockReason')->nullable();
            $table->unsignedInteger('blockedBy')->nullable();
            $table->timestamp('blockedAt')->nullable();

            $table->foreign('blockedBy')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['blockedBy']);

            $table->dropColumn([
                'blockReason',
                'blockedBy',
                'blockedAt',
            ]);
        });
    }
};
