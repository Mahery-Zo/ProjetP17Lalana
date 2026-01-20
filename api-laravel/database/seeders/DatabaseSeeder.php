<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Create default manager account
        User::create([
            'name' => 'Manager',
            'email' => 'manager@lalana.mg',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
        ]);

        // Create test user
        User::create([
            'name' => 'Test User',
            'email' => 'user@lalana.mg',
            'password' => Hash::make('user123'),
            'role' => 'user',
        ]);
    }
}
