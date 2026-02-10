<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatus extends Model
{
    protected $table = 'historique_status';

    protected $fillable = [
        'signalement_id',
        'status',
        'date',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function signalement(): BelongsTo
    {
        return $this->belongsTo(Signalement::class);
    }
}
