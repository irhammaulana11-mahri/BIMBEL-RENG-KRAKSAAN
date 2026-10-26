import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Calendar, AlertCircle, Hourglass, PlayCircle } from "lucide-react";
import { getMyAttendances } from "@/services/tentor/scheduleService";

const formatMinutes = (minutes) => {
  if (!minutes || minutes <= 0) return "0 menit";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} menit`;
  return `${hours} jam ${mins} menit`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case "HADIR": return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-[10px] font-black">HADIR</span>;
    case "IZIN": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-black">IZIN</span>;
    case "SAKIT": return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-black">SAKIT</span>;
    case "ALPA": return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-[10px] font-black">ALPA</span>;
    default: return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-black">BELUM ABSEN</span>;
  }
};

export default function TentorAttendancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    getMyAttendances({ month })
      .then(res => setLogs(res.data?.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [month]);

  const activeSession = logs.find(l => l.session_status === "IN_PROGRESS");
  const presentLogs = logs.filter(l => l.attendance_status === "HADIR");
  const totalTeaching = presentLogs.reduce((sum, l) => sum + (l.teaching_minutes || 0), 0);
  const lateCount = presentLogs.filter(l => l.late_minutes > 0).length;
  const unfilledCount = logs.filter(l => l.attendance_status === "BELUM ABSEN" && ["COMPLETED", "IN_PROGRESS"].includes(l.session_status)).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Absensi & Kehadiran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat kehadiran Anda di setiap sesi KBM. Check-in tercatat saat sesi dimulai, check-out saat sesi diselesaikan.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={16} className="text-gray-400" />
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="text-xs font-bold text-gray-700 outline-none bg-transparent" />
        </div>
      </div>

      {/* SESI YANG SEDANG BERLANGSUNG */}
      {activeSession && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 text-white rounded-xl"><CheckCircle2 size={20}/></div>
            <div>
              <h3 className="text-sm font-black text-emerald-900">Checked In: {activeSession.subject_name} • {activeSession.class_name}</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Masuk pukul {activeSession.checkin_time || "-"} WIB
                {activeSession.late_minutes > 0 ? ` (terlambat ${activeSession.late_minutes} menit)` : " (tepat waktu)"}.
                Selesaikan sesi di workspace untuk check-out.
              </p>
            </div>
          </div>
          <button onClick={() => navigate(`/tentor/sessions/${activeSession.session_id}/workspace`)} className="px-4 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
            <PlayCircle size={14}/> Buka Workspace
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sesi Hadir</p>
          <h3 className="text-3xl font-black text-gray-900 mt-1">{presentLogs.length}<span className="text-sm text-gray-400"> / {logs.length}</span></h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1"><Hourglass size={12}/> Total Mengajar</p>
          <h3 className="text-xl font-black text-indigo-900 mt-2">{formatMinutes(totalTeaching)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12}/> Terlambat</p>
          <h3 className="text-3xl font-black text-rose-900 mt-1">{lateCount} <span className="text-sm text-gray-400">sesi</span></h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tanpa Log</p>
          <h3 className="text-3xl font-black text-amber-900 mt-1">{unfilledCount} <span className="text-sm text-gray-400">sesi</span></h3>
        </div>
      </div>

      {/* RIWAYAT */}
      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat riwayat kehadiran...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm font-bold text-gray-400">Tidak ada sesi KBM pada bulan ini.</div>
      ) : (
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <th className="p-4">Tanggal & Jam</th>
                <th className="p-4">Kelas & Mapel</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Masuk / Keluar</th>
                <th className="p-4 text-center">Terlambat</th>
                <th className="p-4 text-right">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-bold text-gray-900">{item.session_date}</p>
                    <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1"><Clock size={10}/> {item.start_time} - {item.end_time} WIB</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-800">{item.subject_name}</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase">{item.class_name}</p>
                  </td>
                  <td className="p-4 text-center">{getStatusBadge(item.attendance_status)}</td>
                  <td className="p-4 text-center text-xs font-bold text-gray-700">
                    {item.checkin_time || "-"} / {item.checkout_time || "-"}
                  </td>
                  <td className="p-4 text-center text-xs font-bold">
                    {item.attendance_status !== "HADIR" ? <span className="text-gray-400">-</span>
                      : item.late_minutes > 0 ? <span className="text-rose-600">{item.late_minutes} menit</span>
                      : <span className="text-emerald-600">Tepat waktu</span>}
                  </td>
                  <td className="p-4 text-right text-xs font-black text-indigo-700">
                    {item.teaching_minutes > 0 ? formatMinutes(item.teaching_minutes) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
