import React from "react";
import { Eye, Send, Undo2 } from "lucide-react";
import { TrendBadge } from "@/components/report/ReportCardView";
import { REPORT_STATUS, formatScore, formatPercent } from "@/services/academic/progressReportService";

export default function StudentReportList({ data, loading, onOpenDetail, onPublish, onUnpublish }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[860px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th className="p-4">Siswa / Kelas</th>
            <th className="p-4 text-center">Kehadiran</th>
            <th className="p-4 text-center">Rerata Nilai</th>
            <th className="p-4 text-center">Tren</th>
            <th className="p-4 text-center">Catatan Tentor</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {loading ? (
            <tr><td colSpan={7} className="p-6 text-center text-gray-400">Memuat rapor...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={7} className="p-6 text-center text-gray-400">Tidak ada siswa pada filter ini.</td></tr>
          ) : data.map((row) => (
            <tr key={`${row.class_id}-${row.student_id}`} className="hover:bg-gray-50/50">
              <td className="p-4">
                <p className="font-bold text-gray-900">{row.student_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{row.class_name}</p>
              </td>
              <td className="p-4 text-center">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${row.attendance_percentage === null ? "bg-gray-100 text-gray-500" : row.attendance_percentage >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {formatPercent(row.attendance_percentage)}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">{row.hadir} dari {row.held_sessions} sesi</p>
              </td>
              <td className="p-4 text-center">
                <p className="font-bold text-gray-900">{formatScore(row.exam_average)}</p>
                <p className="text-[10px] text-gray-400">{row.exam_count} ujian</p>
              </td>
              <td className="p-4 text-center"><TrendBadge trend={row.exam_trend} /></td>
              <td className="p-4 text-center">
                <span className={`text-xs font-bold ${row.subjects_count > 0 && row.notes_filled >= row.subjects_count ? "text-emerald-700" : "text-gray-500"}`}>
                  {row.notes_filled}/{row.subjects_count} mapel
                </span>
              </td>
              <td className="p-4 text-center">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REPORT_STATUS[row.status]?.className}`}>{REPORT_STATUS[row.status]?.label}</span>
                {row.published_at && <p className="text-[10px] text-gray-400 mt-1">{row.published_at}</p>}
              </td>
              <td className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => onOpenDetail(row)} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Detail
                  </button>
                  {row.status === "PUBLISHED" ? (
                    <button onClick={() => onUnpublish(row)} className="px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs rounded-xl flex items-center gap-1">
                      <Undo2 className="w-3.5 h-3.5" /> Tarik
                    </button>
                  ) : (
                    <button onClick={() => onPublish(row)} className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1">
                      <Send className="w-3.5 h-3.5" /> Terbitkan
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
