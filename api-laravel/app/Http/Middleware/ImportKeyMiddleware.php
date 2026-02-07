<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ImportKeyMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('X-IMPORT-KEY');
        $expected = config('app.firebase_import_key');

        if (!$key || !$expected || !hash_equals($expected, $key)) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        return $next($request);
    }
}
