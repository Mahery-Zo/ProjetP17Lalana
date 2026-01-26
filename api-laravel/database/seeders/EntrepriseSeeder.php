<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Entreprise;

class EntrepriseSeeder extends Seeder
{
    public function run(): void
    {
        $entreprises = [
            [
                'nom' => 'COLAS Madagascar',
                'contact' => 'Jean Rakoto',
                'email' => 'contact@colas.mg',
                'telephone' => '+261 20 22 123 45',
                'adresse' => 'Lot II M 34 Ter Ambohijatovo, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'SOGEA SATOM',
                'contact' => 'Marie Rasoamalala',
                'email' => 'info@sogea.mg',
                'telephone' => '+261 20 22 234 56',
                'adresse' => 'Immeuble SOAVINA, Ankorondrano, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'RAZEL-BEC Madagascar',
                'contact' => 'Paul Andriamahefa',
                'email' => 'contact@razel-bec.mg',
                'telephone' => '+261 20 22 345 67',
                'adresse' => 'Lot VK 35 Ambodivona, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'CHINA ROAD',
                'contact' => 'Li Wei',
                'email' => 'info@chinaroad.mg',
                'telephone' => '+261 20 22 456 78',
                'adresse' => 'Ivandry, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'ENTREPRISE RAMANANTSOA',
                'contact' => 'Hery Ramanantsoa',
                'email' => 'contact@ramanantsoa.mg',
                'telephone' => '+261 20 22 567 89',
                'adresse' => 'Route de Fianarantsoa, Madagascar',
                'active' => true,
            ],
            [
                'nom' => 'BOUYGUES Travaux Publics',
                'contact' => 'Sophie Andrianina',
                'email' => 'contact@bouygues.mg',
                'telephone' => '+261 20 22 678 90',
                'adresse' => 'Ankorondrano, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'EIFFAGE Madagascar',
                'contact' => 'Luc Randrianarison',
                'email' => 'info@eiffage.mg',
                'telephone' => '+261 20 22 789 01',
                'adresse' => 'Ambatobe, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'VINCI Construction',
                'contact' => 'Nathalie Razafindrakoto',
                'email' => 'contact@vinci.mg',
                'telephone' => '+261 20 22 890 12',
                'adresse' => 'Ivato, Antananarivo',
                'active' => true,
            ],
            [
                'nom' => 'STOI (Société de Travaux)',
                'contact' => 'Rija Rakotonirina',
                'email' => 'contact@stoi.mg',
                'telephone' => '+261 20 22 901 23',
                'adresse' => 'Antsirabe, Madagascar',
                'active' => true,
            ],
            [
                'nom' => 'SECREN Madagascar',
                'contact' => 'Fidy Raharison',
                'email' => 'info@secren.mg',
                'telephone' => '+261 20 22 012 34',
                'adresse' => 'Toamasina, Madagascar',
                'active' => true,
            ],
            [
                'nom' => 'ENTREPRISE TSIRY',
                'contact' => 'Tsiry Andriamampianina',
                'email' => 'contact@tsiry.mg',
                'telephone' => '+261 33 11 222 33',
                'adresse' => 'Mahajanga, Madagascar',
                'active' => true,
            ],
            [
                'nom' => 'SOTRAROUTE',
                'contact' => 'Vonjy Rabemananjara',
                'email' => 'info@sotraroute.mg',
                'telephone' => '+261 33 22 333 44',
                'adresse' => 'Toliara, Madagascar',
                'active' => true,
            ],
        ];

        foreach ($entreprises as $entreprise) {
            Entreprise::updateOrCreate(
                ['nom' => $entreprise['nom']],
                $entreprise
            );
        }
    }
}
