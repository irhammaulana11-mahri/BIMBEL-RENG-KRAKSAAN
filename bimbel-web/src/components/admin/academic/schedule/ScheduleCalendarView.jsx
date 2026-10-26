import React, { useState } from "react";
import { Globe, Home, Building2, AlertTriangle } from "lucide-react";
import { DAYS_LIST, STANDARD_TIME_SLOTS } from "../../../../components/constants/schedule.constants";


export default function ScheduleCalendarView({ schedules = [], onSelectSchedule }) {
  const [calendarMode, setCalendarMode] = useState("week");


  const getCardStyle = (locationType, isConflict) => {
    if (isConflict) return "bg-rose-50 border-l-4 border-rose-500 text-rose-900 hover:bg-rose-100/80";
    switch (locationType?.toUpperCase()) {
      case "ONLINE":
        return "bg-purple-50 border-l-4 border-purple-500 text-purple-900 hover:bg-purple-100/80";
      case "PRIVATE":
      case "RUMAH":
        return "bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 hover:bg-emerald-100/80";
      case "REGULER":
      case "BIMBEL":
      default:
        return "bg-blue-50 border-l-4 border-blue-500 text-blue-900 hover:bg-blue-100/80";
    }
  };

  const getScheduleAt = (day, slotStart) => {
    return schedules.find((s) => {
      const isDayMatch = s.day_of_week === day;
      const isTimeMatch = s.start_time?.startsWith(slotStart);
      return isDayMatch && isTimeMatch;
    });
  };

  return (
    <div className="space-y-4 p-4">
      
      {/* Legend Warna & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-gray-600">
          <span className="font-bold text-gray-400 uppercase text-[10px]">Kategori Tipe:</span>
          
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md font-bold">
            <Building2 className="w-3 h-3" /> Reguler (Biru)
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md font-bold">
            <Home className="w-3 h-3" /> Private (Hijau)
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md font-bold">
            <Globe className="w-3 h-3" /> Online (Ungu)
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md font-bold">
            <AlertTriangle className="w-3 h-3" /> Bentrok (Merah)
          </div>
        </div>

        <div className="flex bg-gray-200/80 p-0.5 rounded-xl self-end sm:self-auto">
          <button
            onClick={() => setCalendarMode("week")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calendarMode === "week" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCalendarMode("month")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calendarMode === "month" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* RENDER MINGGUAN (WEEK VIEW) */}
      {calendarMode === "week" ? (
        <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-2xs">
          <table className="w-full min-w-[900px] border-collapse table-fixed">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="p-3 text-xs font-bold text-gray-500 text-center w-28 border-r border-gray-100">Jam KBM</th>
                {DAYS_LIST.map((day) => (
                  <th key={day} className="p-3 text-xs font-black text-gray-800 text-center border-r border-gray-100 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {STANDARD_TIME_SLOTS.map((slot) => (
                <tr key={slot.label} className="h-28">
                  <td className="p-2 text-center text-xs font-mono font-bold text-gray-500 bg-gray-50/30 border-r border-gray-100 align-middle">
                    {slot.label}
                  </td>

                  {DAYS_LIST.map((day) => {
                    const item = getScheduleAt(day, slot.start);

                    return (
                      <td key={day} className="p-1.5 border-r border-gray-100 last:border-r-0 align-top">
                        {item ? (
                          <div
                            onClick={() => onSelectSchedule(item)}
                            className={`w-full h-full p-2.5 rounded-xl transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${getCardStyle(
                              item.location_type,
                              item.has_conflict
                            )}`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black tracking-wider uppercase truncate max-w-[80px]">
                                  {item.class_name}
                                </span>
                                {item.has_conflict && (
                                  <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs font-bold mt-1 leading-snug line-clamp-2">
                                {item.subject_name}
                              </p>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-black/5 text-[11px] space-y-0.5">
                              <p className="font-semibold truncate opacity-90">👨‍🏫 {item.tutor_name}</p>
                              <div className="flex items-center justify-between text-[10px] font-medium opacity-80">
                                <span className="truncate">📍 {item.room_name || item.location_name || "Gedung"}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full border-2 border-dashed border-gray-100 rounded-xl hover:border-blue-200 transition-colors" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* RENDER BULANAN (MONTH VIEW) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DAYS_LIST.map((day) => {
            const daySchedules = schedules.filter((s) => s.day_of_week === day);
            return (
              <div key={day} className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs text-gray-800 uppercase">{day}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {daySchedules.length} Sesi
                  </span>
                </div>

                {daySchedules.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-4 text-center">Tidak ada agenda</p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => onSelectSchedule(sc)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs space-y-1 ${getCardStyle(sc.location_type, sc.has_conflict)}`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-wider">{sc.class_name}</p>
                        <p className="text-xs font-bold">{sc.subject_name}</p>
                        <p className="text-[10px] font-mono font-semibold opacity-80">
                          {sc.start_time?.substring(0, 5)} - {sc.end_time?.substring(0, 5)} WIB
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}