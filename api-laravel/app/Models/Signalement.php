<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Signalement extends Model
{
    protected $fillable = [
        'user_id',
        'latitude',
        'longitude',
        'description',
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

    protected $appends = ['current_status', 'avancement', 'delai_traitement'];

    // ── Relations ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'entreprise_id');
    }

    public function historiqueStatus(): HasMany
    {
        return $this->hasMany(HistoriqueStatus::class)->orderBy('date', 'asc');
    }

    // ── Accessors ──

    /**
     * Dernier status depuis l'historique.
     */
    public function getCurrentStatusAttribute(): ?string
    {
        return $this->historiqueStatus->last()?->status;
    }

    /**
     * Avancement en % : nouveau=0, en_cours=50, termine=100
     */
    public function getAvancementAttribute(): int
    {
        return match ($this->current_status) {
            'en_cours' => 50,
            'termine'  => 100,
            default    => 0,
        };
    }

    /**
     * Délai de traitement en jours (du premier status au status 'termine').
     * Retourne null si pas encore terminé.
     */
    public function getDelaiTraitementAttribute(): ?float
    {
        $first = $this->historiqueStatus->first();
        $termine = $this->historiqueStatus->where('status', 'termine')->last();

        if (!$first || !$termine) {
            return null;
        }

        return round($first->date->diffInDays($termine->date), 1);
    }
}
