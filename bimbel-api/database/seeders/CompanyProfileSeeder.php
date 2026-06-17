<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyProfile;

class CompanyProfileSeeder extends Seeder
{
    public function run(): void
    {
        CompanyProfile::create([
            'company_name' => 'Bimbel Reng Kraksaan',

            'address' =>
                'Kraksaan, Kabupaten Probolinggo, Jawa Timur',

            'phone' => '0335xxxxxxx',

            'whatsapp' => '628123456789',

            'email' => 'info@bimbelrengkraksaan.id',

            'website_url' =>
                'https://bimbelrengkraksaan.id',

            'facebook_url' =>
                'https://facebook.com/bimbelrengkraksaan',

            'instagram_url' =>
                'https://instagram.com/bimbelrengkraksaan',

            'youtube_url' =>
                'https://youtube.com/@bimbelrengkraksaan',

            'latitude' => -7.754,
            'longitude' => 113.419,
        ]);
    }
}