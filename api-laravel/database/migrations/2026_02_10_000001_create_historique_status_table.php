<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('signalement_id')->constrained('signalements')->onDelete('cascade');
            $table->enum('status', ['nouveau', 'en_cours', 'termine']);
            $table->timestamp('date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_status');
    }
};
