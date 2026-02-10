<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create manager user - exactly as you requested
        $this->createManagerUser();
        
        // Optional: Create other role examples
        $this->createExampleUsers();
    }

    private function createManagerUser(): void
    {
        $email = 'manager@lalana.mg';
        
        if (!User::where('email', $email)->exists()) {
            User::create([
                'name' => 'System Manager',
                'email' => $email,
                'password' => Hash::make('manager123'),
                'role' => 'manager',
                'is_blocked' => false,
                'email_verified_at' => now(), // This field exists in your migration
                'remember_token' => Str::random(10), // This field exists in your migration
                // timestamps will be auto-generated
            ]);
            
            $this->command->info('✅ Manager user created successfully!');
            $this->command->info('   Email: ' . $email);
            $this->command->info('   Password: manager123');
            $this->command->info('   Role: manager');
        } else {
            $this->command->warn('⚠️ Manager user already exists: ' . $email);
        }
    }

    private function createExampleUsers(): void
    {
        $users = [
            [
                'name' => 'Admin Example',
                'email' => 'admin@example.com',
                'password' => 'admin123',
                'role' => 'user', // Changed to 'user' since 'admin' is not in your enum
                'is_blocked' => false,
            ],
            [
                'name' => 'Regular User',
                'email' => 'user@example.com',
                'password' => 'user123',
                'role' => 'user',
                'is_blocked' => false,
            ],
            [
                'name' => 'Visitor Account',
                'email' => 'visitor@example.com',
                'password' => 'visitor123',
                'role' => 'visitor',
                'is_blocked' => false,
            ],
            [
                'name' => 'Blocked User',
                'email' => 'blocked@example.com',
                'password' => 'blocked123',
                'role' => 'user',
                'is_blocked' => true,
            ],
        ];

        foreach ($users as $userData) {
            if (!User::where('email', $userData['email'])->exists()) {
                User::create([
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'is_blocked' => $userData['is_blocked'],
                    'email_verified_at' => now(),
                    'remember_token' => Str::random(10),
                ]);
                
                $this->command->info("✅ {$userData['role']} user created: {$userData['email']}");
            }
        }
    }
}