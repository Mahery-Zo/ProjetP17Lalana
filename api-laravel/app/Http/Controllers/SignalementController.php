<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\HistoriqueStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Google\Cloud\Firestore\FirestoreClient;


class SignalementController extends Controller
{
    public function index()
    {
        $signalements = Signalement::with(['user', 'entreprise', 'historiqueStatus'])->get();

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
        ]);

        // Insert initial status in historique_status
        HistoriqueStatus::create([
            'signalement_id' => $signalement->id,
            'status' => 'nouveau',
            'date' => now(),
        ]);

        return response()->json($signalement->load('historiqueStatus'), 201);
    }

    public function show($id)
    {
        $signalement = Signalement::with(['user', 'entreprise', 'historiqueStatus'])->findOrFail($id);

        return response()->json($signalement);
    }

    public function mySignalements(Request $request)
    {
        $signalements = Signalement::with('historiqueStatus')
            ->where('user_id', $request->user()->id)
            ->get();
        return response()->json($signalements);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:nouveau,en_cours,termine',
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $signalement = Signalement::findOrFail($id);

        // Insert new entry in historique_status
        HistoriqueStatus::create([
            'signalement_id' => $signalement->id,
            'status' => $request->status,
            'date' => $request->date,
        ]);

        $signalement->update(['synced_to_firebase' => false]);

        return response()->json($signalement->load(['entreprise', 'historiqueStatus']));
    }

    public function updateDetails(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'surface_m2' => 'nullable|numeric|min:0',
            'budget' => 'nullable|numeric|min:0',
            'entreprise_id' => 'nullable|exists:entreprises,id',
            'repair_category' => 'nullable|integer|min:1|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $signalement = Signalement::findOrFail($id);
        $signalement->update($request->only(['surface_m2', 'budget', 'entreprise_id', 'repair_category']));

        return response()->json($signalement->load(['entreprise', 'historiqueStatus']));
    }

    /**
     * Statistiques globales pour le tableau récapitulatif et le délai moyen.
     */
    public function statistics()
    {
        $signalements = Signalement::with('historiqueStatus')->get();

        $nbSignalements = $signalements->count();
        $totalSurface = $signalements->sum('surface_m2');
        $totalBudget = $signalements->sum('budget');

        // Décompte par status actuel
        $parStatus = ['nouveau' => 0, 'en_cours' => 0, 'termine' => 0];
        $totalAvancement = 0;
        $delais = [];

        foreach ($signalements as $s) {
            $currentStatus = $s->current_status ?? 'nouveau';
            if (isset($parStatus[$currentStatus])) {
                $parStatus[$currentStatus]++;
            }
            $totalAvancement += $s->avancement;

            if ($s->delai_traitement !== null) {
                $delais[] = $s->delai_traitement;
            }
        }

        $avancementMoyen = $nbSignalements > 0
            ? round($totalAvancement / $nbSignalements, 1)
            : 0;

        $delaiMoyen = count($delais) > 0
            ? round(array_sum($delais) / count($delais), 1)
            : null;

        return response()->json([
            'nb_signalements' => $nbSignalements,
            'total_surface_m2' => $totalSurface,
            'total_budget' => $totalBudget,
            'avancement_moyen' => $avancementMoyen,
            'delai_moyen_jours' => $delaiMoyen,
            'par_status' => $parStatus,
            'nb_termines' => $parStatus['termine'],
        ]);
    }



    // public function syncFirebase(Request $request)
    // {
    //     try {
    //         $db = Firebase::database();
    //         $ref = $db->getReference('incoming_signalements');

    //         $items = $ref->getValue();
    //         if (!is_array($items)) {
    //             // In case Firebase returns null / scalar / object
    //             $items = (array) $items;
    //         }

    //         $imported = 0;
    //         $skipped = 0;
    //         $invalid = 0;

    //         foreach ($items as $firebaseId => $data) {
    //             // Convert payload safely
    //             if (is_object($data)) $data = (array) $data;
    //             if (!is_array($data)) {
    //                 $invalid++;
    //                 continue;
    //             }

    //             // Skip already synced
    //             if (!empty($data['synced'])) {
    //                 $skipped++;
    //                 continue;
    //             }

    //             // Validate required fields
    //             $latitude  = $data['latitude']  ?? null;
    //             $longitude = $data['longitude'] ?? null;

    //             if ($latitude === null || $longitude === null) {
    //                 // Optional: mark as invalid in Firebase to avoid retry loop
    //                 $ref->getChild($firebaseId)->update([
    //                     'synced' => false,
    //                     'error'  => 'missing latitude/longitude',
    //                 ]);
    //                 $invalid++;
    //                 continue;
    //             }

    //             // Prevent duplicates
    //             if (Signalement::where('firebase_id', (string)$firebaseId)->exists()) {
    //                 $ref->getChild($firebaseId)->update(['synced' => true]);
    //                 $skipped++;
    //                 continue;
    //             }

    //             DB::transaction(function () use ($firebaseId, $data, $request, $ref, &$imported, $latitude, $longitude) {

    //                 $signalement = Signalement::create([
    //                     'user_id' => $request->user()->id,
    //                     'latitude' => $latitude,
    //                     'longitude' => $longitude,
    //                     'description' => $data['description'] ?? null,
    //                     'photo_url' => $data['photo_url'] ?? null,
    //                     'status' => $data['status'] ?? 'nouveau',

    //                     'firebase_id' => (string)$firebaseId,
    //                     'source' => 'firebase',
    //                     'synced_at' => now(),
    //                     'synced_to_firebase' => false,
    //                 ]);

    //                 // Ack back to Firebase
    //                 $ref->getChild($firebaseId)->update([
    //                     'synced' => true,
    //                     'pg_id' => $signalement->id,
    //                     'synced_at' => now()->toISOString(),
    //                 ]);

    //                 $imported++;
    //             });
    //         }

    //         return response()->json([
    //             'message' => 'Firebase ➜ PostgreSQL sync done',
    //             'imported' => $imported,
    //             'skipped' => $skipped,
    //             'invalid' => $invalid,
    //         ]);
    //     } catch (\Throwable $e) {
    //         Log::error('syncFirebase failed', [
    //             'message' => $e->getMessage(),
    //             'file' => $e->getFile(),
    //             'line' => $e->getLine(),
    //         ]);

    //         return response()->json([
    //             'message' => 'syncFirebase failed',
    //             'error' => $e->getMessage(), // remove in production
    //         ], 500);
    //     }
    // }


    // public function pushToFirebase()
    // {
    //     $db = Firebase::database();
    //     $ref = $db->getReference('signalements');

    //     $signalements = Signalement::where('synced_to_firebase', false)->get();

    //     foreach ($signalements as $s) {
    //         $ref->getChild((string) $s->id)->set([
    //             'id' => $s->id,
    //             'latitude' => (float) $s->latitude,
    //             'longitude' => (float) $s->longitude,
    //             'description' => $s->description,
    //             'status' => $s->status,
    //             'photo_url' => $s->photo_url,
    //             'source' => $s->source,
    //             'updated_at' => $s->updated_at->toISOString(),
    //         ]);

    //         $s->update(['synced_to_firebase' => true]);
    //     }

    //     return response()->json([
    //         'message' => 'PostgreSQL ➜ Firebase sync done',
    //         'count' => $signalements->count(),
    //     ]);
    // }


    // firestore syncronisation

    public function syncFirebase(Request $request)
    {
        try {
            $firestore = app('firebase.firestore');
            /** @var FirestoreClient $fs */
            $fs = $firestore->database();

            $incoming = $fs->collection('signalements');

            // Only fetch unsynced docs (best practice)
            $documents = $incoming->where('synced', '==', false)->documents();

            $imported = 0;
            $skipped  = 0;
            $invalid  = 0;

            foreach ($documents as $doc) {
                if (!$doc->exists()) continue;

                $firebaseId = $doc->id();
                $data = $doc->data();

                // Safety: if synced became true meanwhile
                if (!empty($data['synced'])) {
                    $skipped++;
                    continue;
                }

                $latitude  = $data['latitude']  ?? null;
                $longitude = $data['longitude'] ?? null;

                if ($latitude === null || $longitude === null) {
                    // mark invalid to avoid retry loops
                    $incoming->document($firebaseId)->update([
                        ['path' => 'synced', 'value' => false],
                        ['path' => 'error',  'value' => 'missing latitude/longitude'],
                    ]);
                    $invalid++;
                    continue;
                }

                // Prevent duplicates (same logic as you already had)
                if (Signalement::where('firebase_id', (string)$firebaseId)->exists()) {
                    $incoming->document($firebaseId)->update([
                        ['path' => 'synced', 'value' => true],
                    ]);
                    $skipped++;
                    continue;
                }

                DB::transaction(function () use (
                    $firebaseId,
                    $data,
                    $request,
                    $incoming,
                    &$imported,
                    $latitude,
                    $longitude
                ) {
                    $signalement = Signalement::create([
                        'user_id' => $request->user()->id,
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'description' => $data['description'] ?? null,
                        'photo_url' => $data['photos'] ?? null,

                        'firebase_id' => (string)$firebaseId,
                        'source' => 'firebase',
                        'synced_at' => now(),
                        'synced_to_firebase' => false,
                    ]);

                    // Insert status in historique_status
                    HistoriqueStatus::create([
                        'signalement_id' => $signalement->id,
                        'status' => $data['status'] ?? 'nouveau',
                        'date' => now(),
                    ]);

                    // ACK back to Firestore
                    $incoming->document($firebaseId)->update([
                        ['path' => 'synced',    'value' => true],
                        ['path' => 'pg_id',     'value' => $signalement->id],
                        ['path' => 'synced_at', 'value' => now()->toISOString()],
                    ]);

                    $imported++;
                });
            }

            return response()->json([
                'message'  => 'Firestore ➜ PostgreSQL sync done',
                'imported' => $imported,
                'skipped'  => $skipped,
                'invalid'  => $invalid,
            ]);
        } catch (\Throwable $e) {
            Log::error('syncFirebase (Firestore) failed', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'syncFirebase failed',
                'error'   => $e->getMessage(), // remove in production
            ], 500);
        }
    }


    public function pushToFirebase()
    {
        try {
            $firestore = app('firebase.firestore');
            /** @var FirestoreClient $fs */
            $fs = $firestore->database();

            $signalementsRef = $fs->collection('signalements');

            $signalements = Signalement::where('synced_to_firebase', false)->get();

            foreach ($signalements as $s) {
                $signalementsRef->document((string) $s->id)->set([
                    'id' => $s->id,
                    'latitude' => (float) $s->latitude,
                    'longitude' => (float) $s->longitude,
                    'description' => $s->description,
                    'status' => $s->current_status,
                    'photo_url' => $s->photo_url,
                    'source' => $s->source,
                    'updated_at' => $s->updated_at->toISOString(),
                ], ['merge' => true]);

                $s->update(['synced_to_firebase' => true]);
            }

            return response()->json([
                'message' => 'PostgreSQL ➜ Firestore sync done',
                'count'   => $signalements->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('pushToFirebase (Firestore) failed', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'pushToFirebase failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
