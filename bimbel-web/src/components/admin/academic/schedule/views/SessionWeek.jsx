import React, { useMemo } from "react";
import { Clock, MapPin, Video, User } from "lucide-react";
import { DAY_MAP } from "@/components/constants/schedule.constants"; // Pastikan path ini benar
import { TablePagination } from "@/components/ui/table";


export default function SessionWeek({ data = [], onSelectSession, pagination, onPageChange }) {
  // Standar urutan hari dalam seminggu
  const WEEK_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  // 1. Grouping Data berdasarkan Nama Hari
  const groupedData = useMemo(() => {
    const group = {
      Senin: [], Selasa: [], Rabu: [], Kamis: [], Jumat: [], Sabtu: [], Minggu: []
    };

    data.forEach((item) => {
      let dayName = "Senin"; // default fallback

      // Cek jika data memiliki day_of_week angka (0-6 / 1-7)
      if (item.day_of_week !== undefined && item.day_of_week !== null) {
        if (typeof item.day_of_week === "number" || !isNaN(Number(item.day_of_week))) {
           dayName = DAY_MAP[Number(item.day_of_week)] || "Senin";
        } else {
           dayName = item.day_of_week; 
        }
      } 
      // Fallback jika hanya ada session_date (YYYY-MM-DD)
      else if (item.session_date && item.session_date !== "-") {
        const dateObj = new Date(item.session_date);
        if (!isNaN(dateObj)) {
          const dayIndex = dateObj.getDay(); // 0 = Minggu, 1 = Senin, dst
          dayName = DAY_MAP[dayIndex];
        }
      }

      // Standarisasi kapitalisasi (Senin, Selasa, dst)
      const formattedDay = String(dayName).charAt(0).toUpperCase() + String(dayName).slice(1).toLowerCase();

      if (group[formattedDay]) {
        group[formattedDay].push(item);
      }
    });

    // 2. Sorting jadwal di masing-masing hari berdasarkan start_time
    Object.keys(group).forEach((day) => {
      group[day].sort((a, b) => {
        const timeA = a.start_time || "00:00";
        const timeB = b.start_time || "00:00";
        return timeA.localeCompare(timeB);
      });
    });

    return group;
  }, [data]);

  // Fungsi untuk styling kartu berdasarkan tipe kelas (Reguler / Online / Private)
  const getCardStyle = (type, status) => {
    const classType = String(type).toUpperCase();
    
    // Jika Cancelled, buat card jadi agak pudar/abu-abu
    if (status === "CANCELLED") return "bg-gray-50 border-gray-200 opacity-60";

    if (classType === "ONLINE") return "bg-purple-50 border-purple-200 hover:border-purple-400";
    if (classType === "PRIVATE") return "bg-emerald-50 border-emerald-200 hover:border-emerald-400";
    return "bg-blue-50 border-blue-200 hover:border-blue-400"; // REGULER
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case "ONGOING": return "bg-blue-500 text-white";
      case "COMPLETED": return "bg-emerald-500 text-white";
      case "CANCELLED": return "bg-rose-500 text-white";
      case "RESCHEDULED": return "bg-amber-500 text-white";
      default: return "bg-slate-200 text-slate-700"; // SCHEDULED / ACTIVE
    }
  };

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm animate-in fade-in">
      <div className="min-w-[1200px] grid grid-cols-7 divide-x divide-gray-100">
        
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex flex-col h-full bg-slate-50/30">
            {/* Header Hari */}
            <div className="p-3 text-center border-b border-gray-200 bg-slate-50 sticky top-0 z-10">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">{day}</h3>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                {groupedData[day].length} Sesi
              </p>
            </div>

            {/* List Jadwal per Hari */}
            <div className="p-2 space-y-2.5 h-[600px] overflow-y-auto custom-scrollbar">
              {groupedData[day].length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] font-semibold text-gray-400 italic">Kosong</p>
                </div>
              ) : (
                groupedData[day].map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession && onSelectSession(session)}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden group ${getCardStyle(session.class_type, session.status)}`}
                  >
                    {/* Status Ribbon (Indicator Warna di Kiri) */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBadgeStyle(session.status)}`}></div>
                    
                    {/* Waktu & Tipe */}
                    <div className="flex items-center justify-between ml-1">
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-700">
                        <Clock size={11} className="text-gray-500" />
                        {session.start_time} - {session.end_time}
                      </div>
                      {session.meeting_no && (
                        <span className="text-[9px] font-black bg-white/60 px-1.5 py-0.5 rounded border border-black/5">
                          M-{session.meeting_no}
                        </span>
                      )}
                    </div>

                    {/* Info Mapel & Kelas */}
                    <div className="ml-1">
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        {session.subject_name}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5 truncate">
                        {session.class_name}
                      </p>
                    </div>

                    {/* Tentor & Ruang */}
                    <div className="ml-1 mt-1 pt-1.5 border-t border-black/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 truncate">
                        <User size={11} className="shrink-0 text-gray-400" />
                        <span className="truncate">{session.tentor_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 truncate">
                        {session.class_type === "ONLINE" ? (
                          <Video size={11} className="shrink-0 text-purple-400" />
                        ) : (
                          <MapPin size={11} className="shrink-0 text-rose-400" />
                        )}
                        <span className="truncate">{session.room_name}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

      </div>
      {/* 🟢 Render komponen pagination */}
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Jadwal" />
      )}
    </div>
  );
}