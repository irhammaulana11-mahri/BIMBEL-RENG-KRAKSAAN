<?php
namespace App\Http\Controllers\Api\Website\Concerns;

/**
 * Endpoint konten website dipakai bersama oleh landing page (publik) dan halaman Admin.
 * Pengunjung hanya melihat konten aktif/terbit; Admin yang login (token Sanctum) melihat semuanya.
 */
trait PublicVisibility {

    protected function viewerIsCmsAdmin(): bool {
        $role = auth('sanctum')->user()?->role?->role_name;
        return in_array($role, ['admin', 'super_admin'], true);
    }
}
