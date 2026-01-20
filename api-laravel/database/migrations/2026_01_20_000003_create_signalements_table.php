<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->text('description')->nullable();
            $table->enum('status', ['nouveau', 'en_cours', 'termine'])->default('nouveau');
            $table->decimal('surface_m2', 10, 2)->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->string('entreprise')->nullable();
            $table->string('photo_url')->nullable();
            $table->boolean('synced_to_firebase')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('signalements');
    }
};
