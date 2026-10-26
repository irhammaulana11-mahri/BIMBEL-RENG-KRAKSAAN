import React from "react";
import { Users, MapPin, Video, CheckCircle2 } from "lucide-react";
import { DAY_MAP } from "@/components/constants/schedule.constants";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table";

// 🟢 Tambahkan onPageChange di dalam destructured props
export default function SessionTable({ data, dataSource, onSelectSession, pagination = null, onPageChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "ONGOING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CANCELLED": return "bg-rose-100 text-rose-800 border-rose-200";
      case "RESCHEDULED": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ACTIVE": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTypeColor = (type) => {
    if (type === "ONLINE") return "bg-purple-50 text-purple-700 border-purple-200";
    if (type === "PRIVATE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const parseDay = (dayData) => {
    if (typeof dayData === 'number' || !isNaN(Number(dayData))) {
      return DAY_MAP[Number(dayData)] || dayData;
    }
    return dayData;
  };

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4 w-32">{dataSource === "session" ? "Tanggal" : "Hari Master"}</th>
              <th className="p-4">Kelas & Mapel</th>
              <th className="p-4">Tentor</th>
              <th className="p-4">Lokasi</th>
              <th className="p-4 text-center">Status</th>
              {dataSource === "session" && (
                <th className="p-4 text-center">Absensi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Belum ada data jadwal.</td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => onSelectSession && onSelectSession(item)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-900 uppercase">
                      {dataSource === "session" ? item.session_date : parseDay(item.session_date)}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-gray-500 mt-0.5">
                      {item.start_time} - {item.end_time}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getTypeColor(item.class_type)}`}>
                        {item.class_type}
                      </span>
                      <span className="font-bold text-gray-900">{item.class_name}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      {dataSource === "session" && item.meeting_no && <span className="mr-1 font-black text-blue-600">M-{item.meeting_no}</span>}
                      {item.subject_name}
                    </div>
                  </td>
                  
                  <td className="p-4 font-bold text-gray-800">{item.tentor_name}</td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      {item.class_type === "ONLINE" ? <Video size={14} className="text-purple-500"/> : <MapPin size={14} className="text-rose-500"/>}
                      <span className="truncate max-w-[150px]">{item.room_name}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {dataSource === "session" && (
                    <td className="p-4 text-center">
                      {item.status === 'COMPLETED' ? (
                         <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-green-200">
                           <CheckCircle2 size={12}/> {item.attendance_count || 0}/{item.total_students || 0}
                         </span>
                      ) : (
                         <span className="text-[10px] text-gray-400 font-semibold italic">Belum Absen</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 🟢 Render komponen pagination */}
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Jadwal" />
      )}
    </div>
  );
}