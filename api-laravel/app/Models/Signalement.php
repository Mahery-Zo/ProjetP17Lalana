<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'photo_url',

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
        'synced_to_firebase' => 'boolean',
        'synced_at' => 'datetime',
    ];
}
