<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Services\Tentor\TentorDashboardService;
use App\Http\Resources\Tentor\DashboardResource;

class TentorDashboardController extends Controller {
    protected $dashboardService;

    public function __construct(TentorDashboardService $dashboardService) {
        $this->dashboardService = $dashboardService;
    }

    public function index() {
        $data = $this->dashboardService->getDashboardData();
        return response()->json([
            'success' => true,
            'data'    => new DashboardResource($data)
        ]);
    }
}