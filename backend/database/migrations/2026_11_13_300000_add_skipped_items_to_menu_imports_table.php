<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_imports', function (Blueprint $table) {
            $table->integer('skipped_items')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('menu_imports', function (Blueprint $table) {
            $table->dropColumn('skipped_items');
        });
    }
};
