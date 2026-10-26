import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Users, CheckCircle2, AlertCircle, Clock, CalendarDays } from "lucide-react";
import StudentAttendanceModal from "./StudentAttendanceModal";
import { getStudentSessions } from "@/services/academic/attendanceService";

export default function StudentAttendanceTab() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  const [filters, setFilters] = useState({
    filter_mode: "harian", // "harian" atau "bulanan"
    date: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    keyword: "",
    status: "",
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Memanggil endpoint khusus modul absensi
      const res = await getStudentSessions(filters);
      setSessions(res.data?.data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters.filter_mode, filters.date, filters.month, filters.keyword, filters.status]);

  // Gunakan debounce kecil agar tidak me-render API berkali-kali saat mengetik keyword
  useEffect(() => {
    const timer = setTimeout(() => fetchSessions(), 300);
    return () => clearTimeout(timer);
  }, [fetchSessions]);

  // Kalkulasi KPI Dinamis berdasarkan data tabel
  const totalSesi = sessions.length;
  const belumAbsen = sessions.filter(s => s.attendance_status === "BELUM").length;
  
  // Hitung persentase kehadiran: (Total Murid Hadir / Total Murid Terdaftar di semua sesi) * 100
  const totalMuridHadir = sessions.reduce((sum, s) => sum + s.attended_students, 0);
  const totalMuridTerdaftar = sessions.reduce((sum, s) => sum + s.total_students, 0);
  const persentaseHadir = totalMuridTerdaftar === 0 ? 0 : Math.round((totalMuridHadir / totalMuridTerdaftar) * 100);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 🟢 KPI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tingkat Kehadiran</p>
              <h3 className="text-3xl font-black text-blue-900 mt-1">{persentaseHadir}%</h3>
            </div>
            <div className="p-2 bg-blue-200/50 rounded-xl text-blue-600"><Users size={20}/></div>
          </div>
          <p className="text-[11px] font-semibold text-blue-600 mt-3">
            Berdasarkan Sesi Terfilter
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl border border-emerald-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Sesi KBM</p>
              <h3 className="text-3xl font-black text-emerald-900 mt-1">{totalSesi}</h3>
            </div>
            <div className="p-2 bg-emerald-200/50 rounded-xl text-emerald-600"><CheckCircle2 size={20}/></div>
          </div>
          <p className="text-[11px] font-semibold text-emerald-600 mt-3">
            {filters.filter_mode === "harian" ? filters.date : filters.month}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Belum Diabsen</p>
              <h3 className="text-3xl font-black text-amber-900 mt-1">{belumAbsen}</h3>
            </div>
            <div className="p-2 bg-amber-200/50 rounded-xl text-amber-600"><AlertCircle size={20}/></div>
          </div>
          <p className="text-[11px] font-semibold text-amber-600 mt-3">Perlu Tindakan</p>
        </div>
      </div>

      {/* 🟢 TOOLBAR FILTERS DENGAN HARIAN/BULANAN */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-200/80 p-0.5 rounded-xl border border-gray-200">
            <button 
              onClick={() => setFilters({ ...filters, filter_mode: "harian" })} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "harian" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
            >
              Harian
            </button>
            <button 
              onClick={() => setFilters({ ...filters, filter_mode: "bulanan" })} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "bulanan" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
            >
              Bulanan
            </button>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm focus-within:border-blue-500">
            <Calendar size={16} className="text-gray-400" />
            {filters.filter_mode === "harian" ? (
              <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} className="text-xs font-bold text-gray-700 outline-none bg-transparent"/>
            ) : (
              <input type="month" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="text-xs font-bold text-gray-700 outline-none bg-transparent"/>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari kelas, mapel, tentor..."
            value={filters.keyword}
            onChange={e => setFilters({...filters, keyword: e.target.value})}
            className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <select 
          value={filters.status} 
          onChange={e => setFilters({...filters, status: e.target.value})}
          className="px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none shadow-sm bg-white"
        >
          <option value="">Semua Status Absen</option>
          <option value="SELESAI">Sudah Diabsen</option>
          <option value="BELUM">Belum Diabsen</option>
        </select>
      </div>

      {/* 🟢 TABLE DATA */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-48">Tanggal & Waktu</th>
              <th className="p-4">Kelas & Mapel</th>
              <th className="p-4">Tentor</th>
              <th className="p-4 text-center">Kehadiran</th>
              <th className="p-4 text-center">Status Absen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat data sesi...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-400">Tidak ada jadwal KBM pada rentang waktu ini.</td></tr>
            ) : (
              sessions.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => setSelectedSessionId(item.id)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  <td className="p-4">
                    {/* 🟢 Menampilkan Tanggal Sesi di Tabel Sesuai Rekomendasi */}
                    <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-0.5">
                       <CalendarDays size={14} className="text-blue-500"/> {item.session_date} 
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 ml-5">
                       <Clock size={10} className="inline mr-1"/> {item.start_time} - {item.end_time} WIB
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-blue-700">{item.class_name}</p>
                    <p className="text-xs font-semibold text-gray-600">{item.subject_name}</p>
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-800">{item.tentor_name}</td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-black text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                      {item.attended_students}/{item.total_students}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.attendance_status === "SELESAI" ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black border border-emerald-200">
                        <CheckCircle2 size={12}/> ✓ ABSEN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-black border border-amber-200">
                        <AlertCircle size={12}/> ⚠ BELUM
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🟢 MODAL ABSENSI SISWA */}
      <StudentAttendanceModal 
        open={!!selectedSessionId} 
        sessionId={selectedSessionId} 
        onClose={() => setSelectedSessionId(null)} 
        onSuccess={fetchSessions} 
      />
    </div>
  );
}