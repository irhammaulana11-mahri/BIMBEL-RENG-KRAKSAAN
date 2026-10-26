import React, { useState, useEffect } from "react";
import { PlayCircle, AlertTriangle, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { getTentorDashboard } from "@/services/tentor/dashboardService";

export default function TentorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getTentorDashboard();
        setData(res.data.data);
      } catch (error) {
        console.error("Gagal memuat dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-bold animate-pulse">Memuat Dashboard...</div>;
  }

  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow min-h-screen">
      <div className="mb-6">
      
      {/* 1. WELCOME & NEXT SESSION (Top Block) */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1">Selamat pagi, {data.tentor_name} 👋</h1>
          {data.next_session ? (
            <div className="mt-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Sesi berikutnya</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-white">{data.next_session.subject_name}</p>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                  {data.next_session.start_time}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 mt-2">Tidak ada sesi mengajar lagi hari ini.</p>
          )}
        </div>
        
        {data.next_session && (
          <button className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 font-black text-sm rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center">
            Buka Sesi <ChevronRight size={18} />
          </button>
        )}
      </div>
      

      {/* 2. STATS / KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-black text-gray-900">{data.summary.total}</h3>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase">Sesi Hari</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-black text-emerald-600">{data.summary.completed}</h3>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase">Selesai</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <h3 className="text-3xl font-black text-amber-600">{data.summary.upcoming}</h3>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase">Akan Datang</p>
        </div>
      </div>

      {/* 3. SPLIT VIEW: JADWAL & PERHATIAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Kiri: Jadwal Hari Ini */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Jadwal Mengajar Hari Ini</h3>
          <div className="space-y-3">
            {data.today_schedules.length === 0 ? (
              <p className="text-xs font-bold text-gray-400">Tidak ada jadwal.</p>
            ) : (
              data.today_schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
                  <div className="flex items-center gap-2 text-indigo-600 w-16">
                    <Clock size={14}/>
                    <span className="text-xs font-bold font-mono">{schedule.time}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800">{schedule.subject_name}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kanan: Perlu Perhatian */}
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Perlu Perhatian</h3>
          <div className="space-y-3">
            {data.needs_attention.length === 0 ? (
              <p className="text-xs font-bold text-gray-400">Semua aman terkendali.</p>
            ) : (
              data.needs_attention.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-2 text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
                  <div>
                    <span className="text-[10px] font-black uppercase">{alert.type}</span>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. AKTIVITAS TERAKHIR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Aktivitas Sesi Terakhir</h3>
        <div className="space-y-3">
          {data.recent_activities.length === 0 ? (
             <p className="text-xs font-bold text-gray-400">Belum ada aktivitas terekam.</p>
          ) : (
            data.recent_activities.map((act, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-sm font-bold text-gray-700">{act.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </div>
  );
}