<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Kreait\Laravel\Firebase\Facades\Firebase;

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
    $db = Firebase::database();
    $ref = $db->getReference('incoming_signalements');
    $items = $ref->getValue() ?? [];

    $imported = 0;
    $skipped = 0;

    foreach ($items as $firebaseId => $data) {

        // 1️⃣ Skip if already synced in Firebase
        if (!empty($data['synced'])) {
            $skipped++;
            continue;
        }

        // 2️⃣ Prevent duplicates (CRITICAL)
        if (Signalement::where('firebase_id', $firebaseId)->exists()) {
            $ref->getChild($firebaseId)->update(['synced' => true]);
            $skipped++;
            continue;
        }

        DB::transaction(function () use ($firebaseId, $data, $request, $ref, &$imported) {

            $signalement = Signalement::create([
                'user_id' => $request->user()->id, // manager or mapped user
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'description' => $data['description'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'status' => $data['status'] ?? 'nouveau',

                'firebase_id' => $firebaseId,
                'source' => 'firebase',
                'synced_at' => now(),
                'synced_to_firebase' => false,
            ]);

            // 3️⃣ Ack back to Firebase
            $ref->getChild($firebaseId)->update([
                'synced' => true,
                'pg_id' => $signalement->id,
                'synced_at' => now()->toISOString(),
            ]);

            $imported++;
        });
    }

    return response()->json([
        'message' => 'Firebase ➜ PostgreSQL sync done',
        'imported' => $imported,
        'skipped' => $skipped,
    ]);
}

public function pushToFirebase()
{
    $db = Firebase::database();
    $ref = $db->getReference('signalements');

    $signalements = Signalement::where('synced_to_firebase', false)->get();

    foreach ($signalements as $s) {
        $ref->getChild((string) $s->id)->set([
            'id' => $s->id,
            'latitude' => (float) $s->latitude,
            'longitude' => (float) $s->longitude,
            'description' => $s->description,
            'status' => $s->status,
            'photo_url' => $s->photo_url,
            'source' => $s->source,
            'updated_at' => $s->updated_at->toISOString(),
        ]);

        $s->update(['synced_to_firebase' => true]);
    }

    return response()->json([
        'message' => 'PostgreSQL ➜ Firebase sync done',
        'count' => $signalements->count(),
    ]);
}
}
