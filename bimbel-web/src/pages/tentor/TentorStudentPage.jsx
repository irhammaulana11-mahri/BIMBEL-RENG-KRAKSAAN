import React, { useEffect, useState } from "react";
import { Search, User, Users, CheckCircle2, TrendingUp } from "lucide-react";
import { getTentorStudents } from "@/services/tentor/profileService";
import { formatScore, formatPercent } from "@/services/academic/progressReportService";
import { PredicateBadge } from "@/components/report/ReportCardView";
import { getApiErrorMessage } from "@/utils/apiError";

export default function TentorStudentPage() {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ keyword: "", class_id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getTentorStudents(filters)
        .then((res) => {
          setRows(res.data.data || []);
          setClasses(res.data.classes || []);
          setSummary(res.data.summary);
          setError("");
        })
        .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat data murid.")))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Siswa Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Siswa di kelas yang Anda ajar. Kehadiran dihitung dari sesi yang Anda ajar; nilai dari ujian mapel Anda yang sudah dinilai.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Users size={13} /> Jumlah Siswa</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{summary.students}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={13} /> Rata-rata Kehadiran</p>
            <p className="text-3xl font-black text-emerald-900 mt-1">{formatPercent(summary.average_attendance)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><TrendingUp size={13} /> Rata-rata Nilai</p>
            <p className="text-3xl font-black text-indigo-900 mt-1">{formatScore(summary.average_exam)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Cari nama atau NIS siswa..." className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500 shadow-sm" />
        </div>
        {classes.length > 1 && (
          <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })} className="px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl bg-white">
            <option value="">Semua kelas</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[760px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase">
            <tr>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4">Kelas</th>
              <th className="p-4 text-center">Kehadiran</th>
              <th className="p-4 text-center">Rata-rata Nilai</th>
              <th className="p-4">Ujian Terakhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-semibold">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Memuat siswa...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">{filters.keyword || filters.class_id ? "Tidak ada siswa yang cocok." : "Belum ada siswa di kelas yang Anda ajar."}</td></tr>
            ) : rows.map((st) => (
              <tr key={`${st.class_id}-${st.student_id}`} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center"><User size={14} /></div>
                    <div>
                      <p className="font-bold text-gray-900">{st.name}</p>
                      <p className="font-mono text-[11px] text-gray-400">{st.nis}{st.school_name && ` • ${st.school_name}`}{st.grade && ` • kelas ${st.grade}`}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-indigo-600">{st.class_name}<p className="text-[10px] text-gray-400 font-medium">{st.class_type}</p></td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded font-black ${st.attendance_percentage === null ? "bg-gray-100 text-gray-500" : st.attendance_percentage >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{formatPercent(st.attendance_percentage)}</span>
                  <p className="text-[10px] text-gray-400 mt-1">Hadir {st.hadir}/{st.held_sessions}{st.izin_sakit > 0 && ` • izin/sakit ${st.izin_sakit}`}{st.alpa > 0 && ` • alpa ${st.alpa}`}</p>
                </td>
                <td className="p-4 text-center">
                  <p className="font-black text-gray-900 text-sm">{formatScore(st.exam_average)}</p>
                  <div className="mt-0.5"><PredicateBadge score={st.exam_average} /></div>
                  <p className="text-[10px] text-gray-400">{st.exam_count} ujian</p>
                </td>
                <td className="p-4">
                  {st.last_exam ? (
                    <>
                      <p className="font-bold text-gray-800">{st.last_exam.title}</p>
                      <p className="text-[11px] text-gray-400">{formatScore(st.last_exam.score)}/{st.last_exam.total_score} • {st.last_exam.date}</p>
                    </>
                  ) : <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
