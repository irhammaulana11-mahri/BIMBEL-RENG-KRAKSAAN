import React from "react";
import { Calendar, Clock, User, MapPin, Users } from "lucide-react";

// Daftar pola jadwal dari endpoint overview (mapel / tentor), sumbernya jadwal hasil generate
export function ScheduleList({ schedules = [], showSubject = true, showTentor = true, empty = "Belum ada jadwal." }) {
  if (schedules.length === 0) {
    return <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">{empty}</div>;
  }

  return (
    <div className="space-y-2.5">
      {schedules.map((s) => (
        <div key={s.id} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-lg border border-blue-100 flex items-center gap-1.5">
                <Calendar size={13} /> {s.day_name}
              </span>
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1 font-mono">
                <Clock size={13} className="text-gray-400" /> {s.start_time} - {s.end_time} WIB
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {s.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5 truncate"><Users size={13} className="text-indigo-500 shrink-0" /> <b className="text-gray-800 truncate">{s.class_name}</b> <span className="text-[10px]">({s.class_type})</span></span>
            {showSubject && <span className="truncate">Mapel: <b className="text-gray-800">{s.subject_name}</b></span>}
            {showTentor && <span className="flex items-center gap-1.5 truncate"><User size={13} className="text-amber-500 shrink-0" /> <b className="text-gray-800 truncate">{s.tentor_name || "Belum ditentukan"}</b></span>}
            <span className="flex items-center gap-1.5 truncate"><MapPin size={13} className="text-rose-500 shrink-0" /> {s.location}</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {s.next_date ? <>Sesi berikutnya <b className="text-gray-800">{s.next_date}</b> • {s.remaining} sesi tersisa</> : "Tidak ada sesi mendatang."}
          </p>
        </div>
      ))}
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  amber: "bg-amber-50 border-amber-100 text-amber-700",
  rose: "bg-rose-50 border-rose-100 text-rose-700",
  purple: "bg-purple-50 border-purple-100 text-purple-700",
  indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
  slate: "bg-slate-50 border-slate-100 text-slate-700",
};

// Kotak angka berwarna; items: [{ label, value, hint, tone }]
export function StatTiles({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className={`p-3.5 rounded-2xl border ${TONES[it.tone] || TONES.slate}`}>
          <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{it.label}</p>
          <p className="text-xl font-black mt-1">{it.value ?? "-"}</p>
          {it.hint && <p className="text-[10px] opacity-70 mt-0.5">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

// Batang komposisi kehadiran siswa (Hadir/Izin/Sakit/Alpa)
export function AttendanceBar({ attendance }) {
  const total = attendance?.total || 0;
  const parts = [
    ["Hadir", attendance?.hadir || 0, "bg-emerald-500"],
    ["Izin", attendance?.izin || 0, "bg-blue-500"],
    ["Sakit", attendance?.sakit || 0, "bg-amber-500"],
    ["Alpa", attendance?.alpa || 0, "bg-rose-500"],
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {total > 0 && parts.map(([label, value, cls]) => value > 0 && (
          <div key={label} className={cls} style={{ width: `${(value / total) * 100}%` }} title={`${label}: ${value}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-gray-600">
        {parts.map(([label, value, cls]) => (
          <span key={label} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${cls}`} /> {label} {value}</span>
        ))}
        <span className="ml-auto font-bold text-gray-800">{total > 0 ? `${attendance.rate}% hadir` : "Belum ada data"}</span>
      </div>
    </div>
  );
}
