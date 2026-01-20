<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Lalana API',
        'version' => '1.0.0',
        'docs' => '/api/documentation'
    ]);
});
