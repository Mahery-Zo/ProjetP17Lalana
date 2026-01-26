<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SignalementController extends Controller
{
    public function index()
    {
        $signalements = Signalement::with(['user', 'entreprise'])->get();
        return response()->json($signalements);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'description' => 'nullable|string',
            'photo_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $signalement = Signalement::create([
            'user_id' => $request->user()->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'description' => $request->description,
            'photo_url' => $request->photo_url,
            'status' => 'nouveau',
        ]);

        return response()->json($signalement, 201);
    }

    public function show($id)
    {
        $signalement = Signalement::with(['user', 'entreprise'])->findOrFail($id);
        return response()->json($signalement);
    }

    public function mySignalements(Request $request)
    {
        $signalements = Signalement::where('user_id', $request->user()->id)->get();
        return response()->json($signalements);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:nouveau,en_cours,termine',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $signalement = Signalement::findOrFail($id);
        $signalement->update(['status' => $request->status]);

        return response()->json($signalement);
    }

    public function updateDetails(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'surface_m2' => 'nullable|numeric|min:0',
            'budget' => 'nullable|numeric|min:0',
            'entreprise_id' => 'nullable|exists:entreprises,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $signalement = Signalement::findOrFail($id);
        $signalement->update($request->only(['surface_m2', 'budget', 'entreprise_id']));

        return response()->json($signalement->load('entreprise'));
    }

    public function syncFirebase(Request $request)
    {
        // TODO: Implement Firebase sync logic
        return response()->json(['message' => 'Synchronisation Firebase en cours']);
    }
}
