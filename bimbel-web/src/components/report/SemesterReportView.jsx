import React from "react";
import { CheckCircle, TrendingUp, BookOpen, MessageSquare, CalendarRange } from "lucide-react";
import { formatScore, formatPercent } from "@/services/academic/progressReportService";
import { AttendanceBar, PredicateBadge } from "./ReportCardView";

/**
 * Rekap semester: gabungan rapor bulanan yang sudah terbit.
 */
export default function SemesterReportView({ report }) {
  const { attendance, exam, months = [], subjects = [], general_notes = [] } = report;

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 flex items-center gap-1.5"><CalendarRange className="w-4 h-4" /> Dihitung dari {report.months_count} rapor bulanan yang sudah terbit.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Kehadiran Semester</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{formatPercent(attendance.percentage)}</p>
          <div className="mt-2"><AttendanceBar percentage={attendance.percentage} /></div>
          <p className="text-xs text-gray-500 mt-2">Hadir {attendance.hadir} dari {attendance.held_sessions} sesi • Izin {attendance.izin} • Sakit {attendance.sakit} • Alpa {attendance.alpa}</p>
        </div>
        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-blue-600" /> Rata-rata Nilai Semester</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-gray-900">{formatScore(exam.average)}</p>
            <PredicateBadge score={exam.average} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{exam.count} ujian dinilai</p>
        </div>
      </div>

      {/* Tren per bulan */}
      <div className="border border-gray-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">Tren Bulanan</p>
        <div className="flex items-end gap-3 h-36 border-b border-gray-200 pb-1 overflow-x-auto">
          {months.map((m) => (
            <div key={m.report_id} className="flex flex-col items-center justify-end h-full min-w-[64px] flex-1" title={`${m.label}: hadir ${formatPercent(m.attendance_percentage)}, nilai ${formatScore(m.exam_average)}`}>
              <div className="flex items-end gap-1 h-full w-full justify-center">
                <div className="w-4 bg-emerald-400 rounded-t" style={{ height: `${Math.max(m.attendance_percentage ?? 0, 2)}%` }} />
                <div className="w-4 bg-blue-500 rounded-t" style={{ height: `${Math.max(m.exam_average ?? 0, 2)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-1 overflow-x-auto">
          {months.map((m) => <p key={m.report_id} className="min-w-[64px] flex-1 text-center text-[10px] text-gray-500">{m.label}</p>)}
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-gray-500"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" /> Kehadiran %</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Rata-rata nilai</span></div>
      </div>

      {/* Per mapel */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 text-sm font-bold text-gray-800 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-600" /> Rekap per Mata Pelajaran</div>
        <div className="divide-y divide-gray-100">
          {subjects.map((s) => (
            <div key={s.subject_id} className="p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{s.subject_name}</p>
                  <p className="text-xs text-gray-400">{s.tentor_name || "-"}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center"><p className="text-gray-400 font-semibold">Hadir</p><p className="font-black text-gray-900">{s.hadir}/{s.held_sessions} ({formatPercent(s.attendance_percentage)})</p></div>
                  <div className="text-center"><p className="text-gray-400 font-semibold">Nilai</p><p className="font-black text-gray-900">{formatScore(s.exam_average)}</p></div>
                  <PredicateBadge score={s.exam_average} />
                </div>
              </div>
              {s.notes.length > 0 && (
                <ul className="space-y-1.5">
                  {s.notes.map((n, i) => (
                    <li key={i} className="text-sm text-gray-600 bg-purple-50/50 border border-purple-100 rounded-xl px-3 py-2">
                      <span className="text-[11px] font-bold text-purple-700">{n.period_label}{n.note_by && ` • ${n.note_by}`}</span>
                      <p className="italic whitespace-pre-line">"{n.note}"</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {general_notes.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Catatan Bimbel</p>
          {general_notes.map((n, i) => (
            <p key={i} className="text-sm text-gray-700 whitespace-pre-line"><span className="text-xs font-bold text-gray-500">{n.period_label}:</span> {n.note}</p>
          ))}
        </div>
      )}
    </div>
  );
}
