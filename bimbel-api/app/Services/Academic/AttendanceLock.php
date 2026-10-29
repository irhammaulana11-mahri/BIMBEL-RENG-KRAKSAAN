<?php

namespace App\Services\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\TentorAttendance;
use App\Models\Finance\Invoice;
use App\Models\Finance\PayrollDetail;
use Carbon\Carbon;

/**
 * Kunci absensi siswa (D-01). Absensi satu siswa di satu sesi terkunci bila:
 * (a) tagihan reguler siswa itu untuk kelas & bulan sesi sudah terbit (bukan CANCELLED), atau
 * (b) absensi tentor sesi itu sudah diproses payroll (honor per siswa/pertemuan bergantung padanya).
 * Absensi terkunci hanya bisa diubah lewat koreksi yang disetujui.
 */
class AttendanceLock
{
    public function invoiceFor(ScheduleSession $session, string $studentId): ?Invoice {
        $session->loadMissing('schedule');
        $date = Carbon::parse($session->session_date);

        return Invoice::where('invoice_type', 'REGULAR')
            ->where('student_id', $studentId)
            ->where('class_id', $session->schedule?->class_id)
            ->where('period_year', $date->year)->where('period_month', $date->month)
            ->where('status', '!=', 'CANCELLED')
            ->first();
    }

    public function payrollDetailFor(ScheduleSession $session): ?PayrollDetail {
        $processed = TentorAttendance::where('session_id', $session->id)->where('is_payroll_processed', true)->pluck('id');
        return $processed->isEmpty() ? null
            : PayrollDetail::whereIn('tentor_attendance_id', $processed)->with('payroll')->first();
    }

    public function reason(ScheduleSession $session, string $studentId): ?string {
        if ($invoice = $this->invoiceFor($session, $studentId)) {
            return "tagihan {$invoice->invoice_no} periode ini sudah terbit";
        }
        if ($detail = $this->payrollDetailFor($session)) {
            return "honor sesi ini sudah diproses payroll {$detail->payroll?->payroll_no}";
        }
        return null;
    }
}
