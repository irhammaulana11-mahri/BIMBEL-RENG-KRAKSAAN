<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Website\Lead;
use App\Models\Website\Article;
use App\Models\Website\Package;
use App\Models\Website\Activity;
use App\Models\Admin\User;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Controller;

class DashboardController extends Controller {
    public function index() {
         $user = auth()->user();

        return response()->json([
            'role' => $user->role->role_name,
            'user' => $user,

            'total_leads' => Lead::count(),
            'new_leads' => Lead::where('status','NEW')->count(),
            'articles' => Article::count(),
            'active_packages' => Package::where('is_active',true)->count(),
            'lead_chart' =>
                Lead::select(
                    DB::raw(
                        "TO_CHAR(created_at,'Mon') as month"
                    ),
                    DB::raw(
                        "COUNT(*) as total"
                    )
                )
                ->groupBy('month')
                ->get(),

            'lead_status' => [
                'new' => Lead::where('status','NEW')->count(),
                'contacted' => Lead::where('status','CONTACTED')->count(),
                'follow_up' => Lead::where('status','FOLLOW_UP')->count(),
                'registered' => Lead::where('status','REGISTERED')->count(),
            ],

            'recent_leads' => Lead::latest()->take(5)->get(),

            'recent_articles' => Article::latest()->take(5)->get(),

            'upcoming_activities' => Activity::orderBy('activity_date')->take(5)->get()

        ]);
    }
}