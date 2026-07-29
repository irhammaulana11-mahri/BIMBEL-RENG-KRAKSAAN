<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\ClassRoom;
use App\Models\Admin\Tentor;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\Subject;
use App\Models\Admin\User;
use App\Http\Resources\Academic\ScheduleResource;
use App\Http\Requests\Academic\ScheduleRequest;
use App\Models\Academic\Schedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;



class ScheduleController extends Controller {
    public function index(Request $request) {
        $query = Schedule::query()
            ->with([
                'classroom',
                'subject',
                'tentor.user',
                'location',
            ]);

        // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('room_name', 'ILIKE', "%{$keyword}%")
                    ->orWhereHas('classroom', function (Builder $classroom) use ($keyword) {
                        $classroom->where('name', 'ILIKE', "%{$keyword}%");
                    })

                    ->orWhereHas('subject', function (Builder $subject) use ($keyword) {
                        $subject->where('name', 'ILIKE', "%{$keyword}%");
                    })

                    ->orWhereHas('tentor', function (Builder $tentor) use ($keyword) {
                        $tentor->whereHas('user', function (Builder $user) use ($keyword) {
                            $user->where('name', 'ILIKE', "%{$keyword}%");
                        });
                    })

                    ->orWhereHas('location', function (Builder $location) use ($keyword) {
                        $location->where('location_name', 'ILIKE', "%{$keyword}%");
                    });
            });
        }


        // | Hari
        if ($request->filled('day_of_week')) {
            $query->where('day_of_week',$request->day_of_week);
        }

        // / Pada Query Filter Class Type:
        if ($request->filled('class_type')) {
            $query->whereHas('classroom', function (Builder $q) use ($request) {
                $q->where('class_type', $request->class_type);
            });
        }


        // | Sorting
        $query->orderBy('day_of_week')
                ->orderBy('start_time');

        // | Pagination
        $perPage = $request->integer('per_page',10);

        $schedules = $query
            ->paginate($perPage)
            ->withQueryString();

        return ScheduleResource::collection($schedules);
    }

    public function show(Schedule $schedule) {
        return new ScheduleResource(
            $schedule->load([
                'classroom',
                'subject',
                'tentor.user',
                'location'
            ])
        );
    }
    
    public function store(ScheduleRequest $request) {
        $schedule=Schedule::create($request->validated());
        return new ScheduleResource(
            $schedule->load(['classroom','subject','tentor.user','location'])
        );
    }

    public function update(ScheduleRequest $request, Schedule $schedule) {
        $schedule->update($request->validated());
        return new ScheduleResource(
                $schedule->fresh()
                        ->load(['classroom','subject','tentor.user','location'])
        );
    }

    public function destroy(Schedule $schedule) {
        $schedule->delete();
        return response()->json(['message'=>'Schedule berhasil dihapus.']);
    }

    public function statistics() {
        // | Total Jadwal
        $totalSchedule = Schedule::count();

        // | Total Tentor Mengajar
        $totalTentor = Schedule::distinct('tentor_id')
            ->count('tentor_id');

        // | Total Jam Mengajar
        $totalMinutes = Schedule::selectRaw("
                SUM(
                    EXTRACT(EPOCH FROM (end_time - start_time))
                ) / 60 AS total_minutes
            ")
            ->value('total_minutes');

        $totalHours = round(($totalMinutes ?? 0) / 60);

        /*
        |--------------------------------------------------------------------------
        | Total Conflict
        |--------------------------------------------------------------------------
        | Sprint 1 belum ada pengecekan conflict
        |--------------------------------------------------------------------------
        */

        $totalConflict = 0;

        return response()->json([
            'total_schedule' => $totalSchedule,
            'total_conflict' => $totalConflict,
            'total_tentor' => $totalTentor,
            'total_hours' => $totalHours,
        ]);
    }
}
