import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, PlayCircle, ClipboardCheck, XCircle, CalendarCheck } from "lucide-react";
import { getTentorDashboard } from "@/services/tentor/dashboardService";
import { SESSION_STATUS } from "@/services/parent/parentService";
import { APP_ROUTES } from "../../components/constants/routes";
import { CalendarDays, CheckCircle2 as CheckDone, Clock3, CalendarRange } from "lucide-react";
import PremiumStatCard from "../../components/ui/StatCard";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

const ACTIVITY_ICON = {
  session: <CalendarCheck size={16} className="text-indigo-500" />,
  grade: <ClipboardCheck size={16} className="text-purple-500" />,
  approved: <CheckCircle2 size={16} className="text-emerald-500" />,
  rejected: <XCircle size={16} className="text-rose-500" />,
};

export default function TentorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTentorDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold animate-pulse">Memuat Dashboard...</div>;
  if (!data) return <div className="p-10 text-center text-gray-400 font-bold">Gagal memuat dashboard.</div>;

  const openSession = (session) => {
    if (session.status === "IN_PROGRESS") navigate(APP_ROUTES.TENTOR.WORKSPACE(session.id));
    else navigate("/tentor/schedules");
  };

  return (
    <div className="page-card min-h-screen">
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">{greeting()}, {data.tentor_name} 👋</h1>
          {data.next_session ? (
            <div className="mt-4">
              <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold mb-1">{data.next_session.status === "IN_PROGRESS" ? "Sesi sedang berlangsung" : "Sesi berikutnya"}</p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-lg font-bold text-white">{data.next_session.subject_name} • {data.next_session.class_name}</p>
                <span className="px-2 py-0.5 bg-indigo-950/50 text-indigo-100 text-[11px] font-mono rounded">{data.next_session.start_time} - {data.next_session.end_time}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-indigo-200 mt-2">Tidak ada sesi mengajar lagi hari ini.</p>
          )}
        </div>
        {data.next_session && (
          <button onClick={() => openSession(data.next_session)} className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 font-black text-sm rounded-xl shadow flex items-center gap-2 w-full md:w-auto justify-center">
            {data.next_session.status === "IN_PROGRESS" ? <>Lanjutkan Sesi <ChevronRight size={18} /></> : <>Buka Jadwal <PlayCircle size={18} /></>}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PremiumStatCard title="Sesi Hari Ini" value={data.summary.total} desc="Terjadwal untuk Anda" icon={CalendarDays} colorClass="text-blue-700" />
        <PremiumStatCard title="Selesai" value={data.summary.completed} desc="Sudah diakhiri hari ini" icon={CheckDone} colorClass="text-green-700" />
        <PremiumStatCard title="Belum Selesai" value={data.summary.upcoming + data.summary.in_progress} desc={`${data.summary.in_progress} sedang berlangsung`} icon={Clock3} colorClass="text-amber-700" />
        <PremiumStatCard title="Sesi Minggu Ini" value={data.summary.week_total} desc="Senin s/d Minggu" icon={CalendarRange} colorClass="text-indigo-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Jadwal Mengajar Hari Ini</h3>
          <div className="space-y-2">
            {data.today_schedules.length === 0 ? (
              <p className="text-xs font-bold text-gray-400">Tidak ada jadwal hari ini.</p>
            ) : data.today_schedules.map((s) => (
              <button key={s.id} onClick={() => openSession(s)} className="w-full text-left flex flex-wrap items-center gap-4 hover:bg-slate-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-indigo-600 w-28">
                  <Clock size={14} />
                  <span className="text-xs font-bold font-mono">{s.time} - {s.end_time}</span>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-bold text-gray-800">{s.subject_name}</p>
                  <p className="text-xs text-gray-400">{s.class_name} • absensi {s.attendance_filled}/{s.students_count} • {s.activities_count} aktivitas</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[s.status]?.className}`}>{SESSION_STATUS[s.status]?.label || s.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Perlu Perhatian</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.needs_attention.length === 0 ? (
              <p className="text-xs font-bold text-gray-400">Semua aman terkendali.</p>
            ) : data.needs_attention.map((alert, idx) => (
              <button key={idx} onClick={() => alert.link && navigate(alert.link)} className="w-full text-left flex items-start gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 p-2.5 rounded-lg">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase">{alert.type}</span>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{alert.message}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Aktivitas Terakhir</h3>
        <div className="space-y-3">
          {data.recent_activities.length === 0 ? (
            <p className="text-xs font-bold text-gray-400">Belum ada aktivitas terekam.</p>
          ) : data.recent_activities.map((act, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {ACTIVITY_ICON[act.icon] || <CheckCircle2 size={16} className="text-emerald-500" />}
              <p className="text-sm font-bold text-gray-700 flex-1">{act.message}</p>
              <span className="text-[11px] text-gray-400 font-mono">{act.at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
