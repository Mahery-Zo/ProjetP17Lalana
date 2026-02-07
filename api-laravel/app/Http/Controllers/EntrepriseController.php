<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EntrepriseController extends Controller
{
    public function index()
    {
        $entreprises = Entreprise::where('active', true)->orderBy('nom')->get();
        return response()->json($entreprises);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'contact' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $entreprise = Entreprise::create($request->all());

        return response()->json($entreprise, 201);
    }

    public function show($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        return response()->json($entreprise);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|string|max:255',
            'contact' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $entreprise = Entreprise::findOrFail($id);
        $entreprise->update($request->all());

        return response()->json($entreprise);
    }

    public function destroy($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        $entreprise->delete();

        return response()->json(['message' => 'Entreprise supprimée']);
    }
}
