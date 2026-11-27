<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $this->call([
                UserSeeder::class,
                SpecialistSeeder::class,
                GroupSeeder::class,
                MembershipSeeder::class,
                EventSeeder::class,
                EventAttendeeSeeder::class,
                BookingSeeder::class,
                AdminSupportDataSeeder::class,
            ]);
        });
    }
}