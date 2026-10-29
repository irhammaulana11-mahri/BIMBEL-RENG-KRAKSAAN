import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, PlayCircle, ClipboardCheck, XCircle, CalendarCheck } from "lucide-react";
import { getTentorDashboard } from "@/services/tentor/dashboardService";
import { SESSION_STATUS } from "@/services/parent/parentService";
import { APP_ROUTES } from "../../components/constants/routes";
import { CalendarDays, CheckCircle2 as CheckDone, Clock3, CalendarRange } from "lucide-react";
import PremiumStatCard from "../../components/ui/StatCard";
import DashboardHero from "../../components/ui/DashboardHero";
import Panel from "../../components/ui/DashboardPanel";

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

  if (loading || !data) {
    return <div className="flex items-center justify-center min-h-[60vh] text-base text-gray-500 font-medium">{loading ? "Memuat dashboard..." : "Gagal memuat dashboard."}</div>;
  }

  const openSession = (session) => {
    if (session.status === "IN_PROGRESS") navigate(APP_ROUTES.TENTOR.WORKSPACE(session.id));
    else navigate("/tentor/schedules");
  };

  const next = data.next_session;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6 space-y-6">
        <DashboardHero
          title={`${greeting()}, ${data.tentor_name} 👋`}
          subtitle={next
            ? `${next.status === "IN_PROGRESS" ? "Sesi sedang berlangsung" : "Sesi berikutnya"}: ${next.subject_name} • ${next.class_name} (${next.start_time} - ${next.end_time})`
            : "Tidak ada sesi mengajar lagi hari ini."}
        >
          {next && (
            <button onClick={() => openSession(next)} className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 font-black text-sm rounded-xl shadow flex items-center gap-2 w-full md:w-auto justify-center">
              {next.status === "IN_PROGRESS" ? <>Lanjutkan Sesi <ChevronRight size={18} /></> : <>Buka Jadwal <PlayCircle size={18} /></>}
            </button>
          )}
        </DashboardHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <PremiumStatCard title="Sesi Hari Ini" value={data.summary.total} desc="Terjadwal untuk Anda" icon={CalendarDays} colorClass="text-blue-700" />
          <PremiumStatCard title="Selesai" value={data.summary.completed} desc="Sudah diakhiri hari ini" icon={CheckDone} colorClass="text-green-700" />
          <PremiumStatCard title="Belum Selesai" value={data.summary.upcoming + data.summary.in_progress} desc={`${data.summary.in_progress} sedang berlangsung`} icon={Clock3} colorClass="text-amber-700" />
          <PremiumStatCard title="Sesi Minggu Ini" value={data.summary.week_total} desc="Senin s/d Minggu" icon={CalendarRange} colorClass="text-indigo-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <Panel title="Jadwal Mengajar Hari Ini" link={{ to: "/tentor/schedules", label: "Jadwal" }} tone="blue">
              {data.today_schedules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tidak ada jadwal hari ini.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.today_schedules.map((s) => (
                    <button key={s.id} onClick={() => openSession(s)} className="w-full text-left py-3 flex flex-wrap items-center gap-3 border-l-4 pl-3 rounded-sm hover:bg-slate-50" style={{ borderColor: s.status === "COMPLETED" ? "#10b981" : s.status === "IN_PROGRESS" ? "#6366f1" : "#f59e0b" }}>
                      <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1"><Clock size={13} /> {s.time}-{s.end_time}</span>
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-bold text-gray-900">{s.subject_name} • {s.class_name}</p>
                        <p className="text-xs text-gray-500">Absensi {s.attendance_filled}/{s.students_count} • {s.activities_count} aktivitas</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[s.status]?.className}`}>{SESSION_STATUS[s.status]?.label || s.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title={`Perlu Perhatian (${data.needs_attention.length})`} tone="amber">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.needs_attention.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Semua aman terkendali.</p>
              ) : data.needs_attention.map((alert, idx) => (
                <button key={idx} onClick={() => alert.link && navigate(alert.link)} className="w-full text-left flex items-start gap-2 p-2.5 rounded-xl text-sm bg-amber-50 hover:bg-amber-100 text-amber-900">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-[10px] font-black uppercase">{alert.type}</span>
                    <span className="block text-xs font-semibold text-gray-800 mt-0.5">{alert.message}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Aktivitas Terakhir" tone="emerald">
          {data.recent_activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada aktivitas terekam.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recent_activities.map((act, idx) => (
                <div key={idx} className="py-2.5 flex items-center gap-3">
                  {ACTIVITY_ICON[act.icon] || <CheckCircle2 size={16} className="text-emerald-500" />}
                  <p className="text-sm font-semibold text-gray-700 flex-1">{act.message}</p>
                  <span className="text-[11px] text-gray-400 font-mono">{act.at}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
