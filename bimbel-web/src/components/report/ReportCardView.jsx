import React from "react";
import { CheckCircle, TrendingUp, TrendingDown, Minus, MessageSquare, BookOpen, ClipboardList } from "lucide-react";
import { formatScore, formatPercent, scorePredicate } from "@/services/academic/progressReportService";

export function TrendBadge({ trend }) {
  if (trend === "up") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold"><TrendingUp className="w-3 h-3" /> Naik</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-bold"><TrendingDown className="w-3 h-3" /> Turun</span>;
  if (trend === "flat") return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold"><Minus className="w-3 h-3" /> Stabil</span>;
  return <span className="text-xs text-gray-400">-</span>;
}

export function PredicateBadge({ score }) {
  const predicate = scorePredicate(score);
  if (!predicate) return null;
  return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${predicate.className}`}>{predicate.label}</span>;
}

export function AttendanceBar({ percentage }) {
  const value = percentage ?? 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div className={`h-full ${value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${value}%` }} />
    </div>
  );
}

/**
 * Isi rapor bulanan (data dari API rapor: live/draft maupun snapshot terbit).
 */
export default function ReportCardView({ report }) {
  const { attendance, exam, exams = [], subjects = [], general_note } = report;

  return (
    <div className="space-y-5">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-600" /> Kehadiran</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{formatPercent(attendance.percentage)}</p>
          <div className="mt-2"><AttendanceBar percentage={attendance.percentage} /></div>
          <p className="text-xs text-gray-500 mt-2">
            Hadir {attendance.hadir} dari {attendance.held_sessions} sesi
            {attendance.izin > 0 && ` • Izin ${attendance.izin}`}
            {attendance.sakit > 0 && ` • Sakit ${attendance.sakit}`}
            {attendance.alpa > 0 && ` • Alpa ${attendance.alpa}`}
            {attendance.not_recorded > 0 && ` • Belum dicatat ${attendance.not_recorded}`}
          </p>
        </div>
        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/40">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-blue-600" /> Rata-rata Nilai Ujian</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-black text-gray-900">{formatScore(exam.average)}</p>
            <PredicateBadge score={exam.average} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{exam.count} ujian dinilai</span>
            {exam.previous_average !== null && <span>• bulan lalu {formatScore(exam.previous_average)}</span>}
            <TrendBadge trend={exam.trend} />
          </div>
        </div>
      </div>

      {/* Per mapel */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 text-sm font-bold text-gray-800 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-indigo-600" /> Perkembangan per Mata Pelajaran</div>
        {subjects.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Belum ada sesi, ujian, atau catatan pada periode ini.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {subjects.map((s) => (
              <div key={s.subject_id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{s.subject_name}</p>
                    <p className="text-xs text-gray-400">{s.tentor_name || "Tentor belum ditentukan"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center"><p className="text-gray-400 font-semibold">Hadir</p><p className="font-black text-gray-900">{s.hadir}/{s.held_sessions}</p></div>
                    <div className="text-center"><p className="text-gray-400 font-semibold">Nilai</p><p className="font-black text-gray-900">{formatScore(s.exam_average)}</p></div>
                    <PredicateBadge score={s.exam_average} />
                  </div>
                </div>
                {s.note ? (
                  <p className="text-sm text-gray-600 italic bg-purple-50/50 border border-purple-100 rounded-xl px-3 py-2 whitespace-pre-line">"{s.note}"{s.note_by && <span className="not-italic text-xs text-purple-600 font-semibold"> — {s.note_by}</span>}</p>
                ) : (
                  <p className="text-xs text-gray-400">Belum ada catatan tentor.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daftar ujian */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 text-sm font-bold text-gray-800 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-blue-600" /> Nilai Ujian</div>
        {exams.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Belum ada ujian yang selesai dinilai.</p>
        ) : (
          <div className="p-4">
            <div className="flex items-end gap-2 h-32 border-b border-gray-200 pb-1 overflow-x-auto">
              {exams.map((e, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full min-w-[44px] flex-1" title={`${e.title}: ${formatScore(e.score)}`}>
                  <span className="text-[10px] font-bold text-blue-700 mb-1">{formatScore(e.score)}</span>
                  <div className="w-7 bg-blue-500/80 rounded-t-md" style={{ height: `${Math.max(e.score, 2)}%` }} />
                </div>
              ))}
            </div>
            <table className="w-full text-xs mt-3">
              <thead><tr className="text-gray-400 uppercase"><th className="py-1.5 text-left">Tanggal</th><th className="py-1.5 text-left">Ujian</th><th className="py-1.5 text-right">Skor</th><th className="py-1.5 text-right">Nilai (0-100)</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map((e, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-gray-500">{e.date}</td>
                    <td className="py-1.5"><span className="font-semibold text-gray-800">{e.title}</span> <span className="text-gray-400">• {e.subject_name}</span></td>
                    <td className="py-1.5 text-right text-gray-500">{formatScore(e.raw_score)}/{e.total_score}</td>
                    <td className="py-1.5 text-right font-bold text-gray-900">{formatScore(e.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {general_note && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Catatan Bimbel</p>
          <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{general_note}</p>
        </div>
      )}
    </div>
  );
}
