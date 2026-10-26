import React from "react";
import { Clock, Calendar, User, MapPin, Users } from "lucide-react";

export default function SubjectScheduleView({ schedules = [], loading = false }) {
  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-400">Memuat jadwal pembelajaran...</div>;
  }

  if (schedules.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
        Belum ada jadwal pembelajaran yang dikaitkan dengan mata pelajaran ini.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
          Jadwal Aktif ({schedules.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-2xs transition-all space-y-2.5 group"
          >
            {/* Top Bar: Hari & Jam */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg border border-blue-100 flex items-center gap-1.5">
                  <Calendar size={13} /> {schedule.day_name || schedule.day_of_week || schedule.day || "Senin"}
                </span>
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1 font-mono">
                  <Clock size={13} className="text-gray-400" /> {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)} WIB
                </span>
              </div>

              {schedule.is_active !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                  schedule.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                }`}>
                  {schedule.is_active ? "Aktif" : "Non-Aktif"}
                </span>
              )}
            </div>

            {/* Bottom Info: Tentor, Ruang, Kelas */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-[11px] text-gray-500 font-medium">
              <div className="flex items-center gap-1.5 truncate">
                <User size={13} className="text-amber-500 shrink-0" />
                <span className="truncate">
                  Tentor: <strong className="text-gray-800">{schedule.tentor_name || schedule.tentor?.user?.name || schedule.tentor?.name || "Belum ditentukan"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 truncate">
                <Users size={13} className="text-purple-500 shrink-0" />
                <span className="truncate">
                  Kelas: <strong className="text-gray-800">{schedule.classroom_name || schedule.classroom?.name || "-"}</strong>
                </span>
              </div>

              {schedule.room_name && (
                <div className="flex items-center gap-1.5 col-span-2 truncate">
                  <MapPin size={13} className="text-rose-500 shrink-0" />
                  <span className="truncate">
                    Ruangan: <strong className="text-gray-800">{schedule.room_name}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}