<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $fillable = [
        'nom',
        'contact',
        'email',
        'telephone',
        'adresse',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function signalements()
    {
        return $this->hasMany(Signalement::class);
    }
}
