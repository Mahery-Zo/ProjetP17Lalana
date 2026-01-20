<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('signalements', function (Blueprint $table) {
            // Renommer la colonne entreprise en entreprise_old temporairement
            $table->renameColumn('entreprise', 'entreprise_old');
        });

        Schema::table('signalements', function (Blueprint $table) {
            // Ajouter la nouvelle colonne entreprise_id
            $table->foreignId('entreprise_id')->nullable()->after('budget')->constrained('entreprises')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('signalements', function (Blueprint $table) {
            $table->dropForeign(['entreprise_id']);
            $table->dropColumn('entreprise_id');
            $table->renameColumn('entreprise_old', 'entreprise');
        });
    }
};
