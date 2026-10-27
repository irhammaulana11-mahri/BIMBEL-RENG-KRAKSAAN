<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardService;

/**
 * Dashboard Admin: ringkasan akademik, keuangan, dan pekerjaan yang menunggu tindakan.
 */
class DashboardController extends Controller {

    public function __construct(protected AdminDashboardService $service) {}

    public function index() {
        return response()->json(['success' => true, 'data' => $this->service->summary()]);
    }
}
