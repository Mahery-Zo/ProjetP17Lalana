<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Signalement extends Model
{
    protected $fillable = [
        'user_id',
        'latitude',
        'longitude',
        'description',
        'status',
        'surface_m2',
        'budget',
        'entreprise',
        'entreprise_id',
        'photo_url',
        'repair_category',

        // sync fields
        'firebase_id',
        'source',
        'synced_at',
        'synced_to_firebase',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'surface_m2' => 'decimal:2',
        'budget' => 'decimal:2',
        'repair_category' => 'integer',
        'synced_to_firebase' => 'boolean',
        'synced_at' => 'datetime',
    ];

       public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }
}
