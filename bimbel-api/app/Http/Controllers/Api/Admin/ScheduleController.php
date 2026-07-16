<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller {
    public function index() {
        return response()->json(Schedule::with(['tutor.user','subject','classRoom','location'])->get());
    }

    public function show($id) {
        return response()->json(Schedule::with(['tutor.user','subject','classRoom','location'])->findOrFail($id));
    }
    
    public function store(Request $request) {
        $request->validate([
            'tutor_id' => 'required',
            'subject_id' => 'required',
            'class_id' => 'required',
            'location_id' => 'required',
            'day_of_week' => 'required',
            'start_time' => 'required',
            'end_time' => 'required'
        ]);

        $schedule = Schedule::create([
            'tutor_id' => $request->tutor_id,
            'subject_id' => $request->subject_id,
            'class_id' => $request->class_id,
            'location_id' => $request->location_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'room_name' => $request->room_name,
            'status' => $request->status ?? 'ACTIVE'
        ]);

        return response()->json(['success' => true,'data' => $schedule], 201);
    }

    public function update(Request $request, $id) {
        $schedule = Schedule::findOrFail($id);
        $schedule->update($request->all());
        return response()->json(['success' => true,'data' => $schedule]);
    }

    public function destroy($id) {
        Schedule::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
