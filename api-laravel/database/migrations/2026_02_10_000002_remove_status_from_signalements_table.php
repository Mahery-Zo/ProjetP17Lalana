<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Migrate existing status data into historique_status
        $signalements = DB::table('signalements')->whereNotNull('status')->get();

        foreach ($signalements as $signalement) {
            DB::table('historique_status')->insert([
                'signalement_id' => $signalement->id,
                'status' => $signalement->status,
                'date' => $signalement->updated_at ?? $signalement->created_at ?? now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Drop the status column from signalements
        Schema::table('signalements', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    public function down(): void
    {
        Schema::table('signalements', function (Blueprint $table) {
            $table->enum('status', ['nouveau', 'en_cours', 'termine'])->default('nouveau')->after('description');
        });

        // Restore status from historique_status (latest per signalement)
        $latestStatuses = DB::table('historique_status')
            ->select('signalement_id', 'status')
            ->whereIn('id', function ($query) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('historique_status')
                    ->groupBy('signalement_id');
            })
            ->get();

        foreach ($latestStatuses as $row) {
            DB::table('signalements')
                ->where('id', $row->signalement_id)
                ->update(['status' => $row->status]);
        }
    }
};
