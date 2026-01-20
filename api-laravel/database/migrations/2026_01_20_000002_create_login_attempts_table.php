<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->timestamp('created_at');
            $table->index(['email', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('login_attempts');
    }
};
