import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, CheckCircle2, AlertCircle, LayoutGrid, Table as TableIcon } from "lucide-react";
import TentorAttendanceDetailModal from "./TentorAttendanceDetailModal";
import AttendanceSessionGrid from "./AttendanceSessionGrid";
import { getTentorAttendances } from "@/services/academic/attendanceService";

export default function TentorAttendanceTab() {
  const [loading, setLoading] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // View Switcher (Table vs Grid)
  const [viewMode, setViewMode] = useState("table");

  const [filters, setFilters] = useState({
    filter_mode: "harian", // "harian" atau "bulanan"
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    keyword: "",
  });

  const fetchTentorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTentorAttendances(filters);
      // Gunakan fallback array jika backend belum siap sepenuhnya
      setAttendances(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters.filter_mode, filters.date, filters.month, filters.keyword]);

  useEffect(() => {
    // Gunakan debounce kecil untuk keyword search jika diperlukan, saat ini langsung eksekusi.
    const timer = setTimeout(() => fetchTentorLogs(), 300);
    return () => clearTimeout(timer);
  }, [fetchTentorLogs]);

  // Hitung KPI Dinamis
  const totalSesi = attendances.length;
  const belumAbsen = attendances.filter(a => a.attendance_status === "BELUM ABSEN" || !a.attendance_status).length;
  const terlambat = attendances.filter(a => a.attendance_status === "HADIR" && a.late_minutes > 0).length;
  const persentaseHadir = totalSesi === 0 ? 0 : Math.round((attendances.filter(a => a.attendance_status === "HADIR").length / totalSesi) * 100);

  const getStatusBadge = (status) => {
    switch(status) {
      case "HADIR": return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-black">HADIR</span>;
      case "IZIN": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-black">IZIN</span>;
      case "SAKIT": return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-black">SAKIT</span>;
      case "ALPA": return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-[10px] font-black">ALPA</span>;
      default: return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-black">BELUM ABSEN</span>;
    }
  };

  const getLateBadge = (item) => {
    if (item.attendance_status !== "HADIR") return <span className="text-gray-400 text-xs font-semibold">-</span>;
    if (item.late_minutes > 0) return <span className="text-rose-600 text-xs font-bold flex items-center justify-center gap-1"><AlertCircle size={12}/> {item.late_minutes} menit</span>;
    return <span className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1"><CheckCircle2 size={12}/> Tepat Waktu</span>;
  };

  // Perbarui baris setelah Admin mengoreksi absensi tentor
  const handleSaved = (updated) => {
    setAttendances(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedLog(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* KPI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Kehadiran Tentor</p>
          <h3 className="text-3xl font-black text-indigo-900 mt-1">{persentaseHadir}%</h3>
          <p className="text-[11px] font-semibold text-indigo-600 mt-3">
            {filters.filter_mode === 'harian' ? filters.date : filters.month}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-100">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Belum Diabsen</p>
          <h3 className="text-3xl font-black text-amber-900 mt-1">{belumAbsen} Sesi</h3>
          <p className="text-[11px] font-semibold text-amber-600 mt-3">Perlu Perhatian</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 rounded-2xl border border-rose-100">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Tentor Terlambat</p>
          <h3 className="text-3xl font-black text-rose-900 mt-1">{terlambat}</h3>
          <p className="text-[11px] font-semibold text-rose-600 mt-3">Perlu Verifikasi</p>
        </div>
      </div>

      {/* TOOLBAR FILTERS & VIEW MODE */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-gray-200">
        
        <div className="flex items-center gap-3">
          {/* Toggle Harian/Bulanan */}
          <div className="flex bg-gray-200/80 p-0.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setFilters({ ...filters, filter_mode: "harian" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "harian" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilters({ ...filters, filter_mode: "bulanan" })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "bulanan" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              Bulanan
            </button>
          </div>

          {/* Input Date/Month sesuai mode */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            {filters.filter_mode === "harian" ? (
              <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} className="text-xs font-bold text-gray-700 outline-none bg-transparent"/>
            ) : (
              <input type="month" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="text-xs font-bold text-gray-700 outline-none bg-transparent"/>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari tentor, mapel, kelas..." 
              value={filters.keyword} 
              onChange={e => setFilters({...filters, keyword: e.target.value})} 
              className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500 shadow-sm" 
            />
          </div>

          {/* View Switcher: Daftar (Table) vs Ringkasan (Grid) */}
          <div className="flex bg-gray-200/80 p-0.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode("table")}
              title="Daftar Table"
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Ringkasan Sesi (Card)"
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TAMPILAN DATA (TABLE ATAU GRID) */}
      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat data absensi tentor...</div>
      ) : attendances.length === 0 ? (
        <div className="p-12 text-center text-sm font-bold text-gray-400 border border-gray-200 rounded-2xl bg-white">Tidak ada jadwal KBM pada rentang waktu ini.</div>
      ) : viewMode === "table" ? (
        
        /* 1. VIEW TABLE */
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-40">Tanggal & Jam</th>
                <th className="p-4">Kelas & Mapel</th>
                <th className="p-4">Tentor</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Keterlambatan</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-bold text-gray-900">{item.session_date}</p>
                    <p className="text-[10px] font-semibold text-gray-500">{item.start_time} - {item.end_time} WIB</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-800">{item.subject_name}</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase">{item.class_name}</p>
                  </td>
                  <td className="p-4 text-sm font-bold text-indigo-700">{item.tentor_name}</td>
                  <td className="p-4 text-center">{getStatusBadge(item.attendance_status)}</td>
                  <td className="p-4 text-center">{getLateBadge(item)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedLog(item)} className="px-3 py-1.5 bg-white border border-gray-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg text-xs font-bold shadow-sm transition-colors">
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (

        /* 2. VIEW GRID (Ringkasan Sesi) */
        <AttendanceSessionGrid data={attendances} onSelectSession={(item) => setSelectedLog(item)} />
      )}

      {/* MODAL DETAIL TENTOR */}
      <TentorAttendanceDetailModal 
        open={!!selectedLog} 
        data={selectedLog} 
        onClose={() => setSelectedLog(null)} 
        onSaved={handleSaved}
      />
    </div>
  );
}