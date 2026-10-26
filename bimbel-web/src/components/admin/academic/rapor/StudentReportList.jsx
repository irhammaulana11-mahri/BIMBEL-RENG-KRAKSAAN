import React from "react";
import { Send, Eye, TrendingUp, TrendingDown } from "lucide-react";

export default function StudentReportList({ data, onOpenDetail, onSendWA }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th className="p-5">Nama Siswa / Rombel</th>
            <th className="p-5 text-center">Kehadiran Sebulan</th>
            <th className="p-5 text-center">Rerata Nilai</th>
            <th className="p-5 text-center">Tren Nilai</th>
            <th className="p-5 text-center">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-6 text-center text-gray-400">Tidak ada data perkembangan siswa.</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-5">
                  <p className="font-bold text-gray-900">{row.student_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Kelas: {row.class_name}</p>
                </td>
                <td className="p-5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      row.attendance_percentage >= 80 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {row.attendance_percentage}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{row.present_count} dari {row.total_meetings} Sesi</span>
                  </div>
                </td>
                <td className="p-5 text-center font-bold text-gray-900 text-base">
                  {row.average_exam_score}
                </td>
                <td className="p-5 text-center">
                  <div className="flex justify-center">
                    {row.exam_trend === "up" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" /> Naik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-semibold">
                        <TrendingDown className="w-3 h-3" /> Turun
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onOpenDetail(row)}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail Grafik
                    </button>
                    <button
                      onClick={() => onSendWA(row)}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Send className="w-3 h-3" /> Kirim Rapor
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}