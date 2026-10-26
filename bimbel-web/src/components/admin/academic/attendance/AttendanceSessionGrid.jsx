import React from "react";
import { Clock, Users, ShieldAlert, CheckCircle2, Globe, Home, Building2, CalendarDays } from "lucide-react";

export default function AttendanceSessionGrid({ data, onSelectSession }) {
  const renderLocationIcon = (type) => {
    switch (type) {
      case "online": return <Globe className="w-4 h-4 text-blue-500" />;
      case "rumah": return <Home className="w-4 h-4 text-emerald-500" />;
      case "bimbel": return <Building2 className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getCardStyle = (type) => {
    switch (type) {
      case "online": return "hover:border-blue-300 hover:shadow-blue-50/50";
      case "rumah": return "hover:border-emerald-300 hover:shadow-emerald-50/50";
      case "bimbel": return "hover:border-purple-300 hover:shadow-purple-50/50";
      default: return "hover:border-gray-300";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
      {data.map((session) => (
        <div 
          key={session.id}
          className={`bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between ${getCardStyle(session.location_type)}`}
        >
          <div>
            {/* Baris Atas: Jam Sesi & Lokasi Tipe */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{session.start_time} - {session.end_time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {renderLocationIcon(session.location_type)}
                <span className="text-[10px] font-black tracking-wider uppercase text-gray-400">
                  {session.location_type === "online" ? "Online" : session.location_type === "rumah" ? "Rumah" : "Bimbel"}
                </span>
              </div>
            </div>

            {/* Tanggal Sesi */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 mb-2 bg-indigo-50 w-max px-2 py-0.5 rounded-md">
               <CalendarDays size={12}/> {session.session_date}
            </div>

            {/* Judul Kelas dan Pelajaran */}
            <h3 className="text-[11px] font-black tracking-wider uppercase text-gray-400 mb-0.5">{session.class_name}</h3>
            <h2 className="text-sm font-black text-gray-900 leading-snug">{session.subject_name}</h2>
            <p className="text-xs text-gray-500 mt-2">
              Tentor: <span className="font-bold text-indigo-700">{session.tentor_name}</span>
            </p>
          </div>

          {/* Baris Bawah: Kehadiran Murid & Kehadiran Tentor */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-gray-500">Presensi Murid:</span>
              <strong className="text-gray-900">{session.present_count} / {session.total_students}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Kehadiran Tentor:</span>
              {session.attendance_status !== "HADIR" ? (
                <span className="text-gray-400 font-semibold">{session.attendance_status}</span>
              ) : session.late_minutes > 0 ? (
                <span className="flex items-center gap-1 text-rose-600 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" /> Terlambat {session.late_minutes} mnt
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tepat Waktu
                </span>
              )}
            </div>

            {/* 🟢 Tombol Lihat Detail untuk Membuka Modal Log Tentor */}
            <button 
              onClick={() => onSelectSession(session)}
              className="w-full mt-4 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              Lihat Detail Presensi
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}