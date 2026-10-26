import React from "react";
import { Clock, MapPin } from "lucide-react";
import { groupBySchedule, formatScheduleLabel } from "../../../../utils/schedule.utils";
import { TablePagination } from "@/components/ui/table";


export default function SessionTimeline({ data, onSelectSession,pagination = null, onPageChange}) {
  // Mengelompokkan data menggunakan helper utils
  const groupedData = groupBySchedule(data);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {Object.entries(groupedData).map(([groupKey, sessions]) => (
        <div key={groupKey} className="relative">
          {/* Header Label yang Otomatis Menyesuaikan */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm py-2 mb-4">
            <h2 className="text-sm font-black text-blue-800 bg-blue-50 inline-block px-4 py-1.5 rounded-full border border-blue-200 shadow-sm uppercase">
              🗓️ {formatScheduleLabel(sessions[0])}
            </h2>
          </div>

          {/* Garis Vertikal Timeline */}
          <div className="absolute left-[31px] top-12 bottom-0 w-0.5 bg-gray-100 -z-10"></div>

          <div className="space-y-4">
            {sessions.map((session) => {
              const tentorInitial = session.tentor_name ? session.tentor_name.charAt(0).toUpperCase() : "T";
              
              return (
                <div 
                  key={session.id || session.uuid} 
                  onClick={() => onSelectSession && onSelectSession(session)}
                  className="flex gap-4 group cursor-pointer"
                >
                  {/* Waktu di Kiri */}
                  <div className="w-16 shrink-0 text-right pt-3 relative">
                    <div className="text-xs font-mono font-black text-gray-900">{session.start_time}</div>
                    <div className="absolute top-4 -right-[21px] w-3 h-3 rounded-full border-2 border-white bg-blue-500 shadow-sm group-hover:scale-125 transition-transform"></div>
                  </div>

                  {/* Card Konten Kanan */}
                  <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm group-hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                          {session.class_name} {session.meeting_no ? `• Meeting ${session.meeting_no}` : ""}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{session.subject_name}</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                        {session.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px]">
                          {tentorInitial}
                        </span>
                        <span className="text-gray-800 font-semibold">{session.tentor_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <MapPin size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{session.room_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
        {/* 🟢 Render komponen pagination */}
        {pagination && (
          <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Jadwal" />
        )}
    </div>
  );
}