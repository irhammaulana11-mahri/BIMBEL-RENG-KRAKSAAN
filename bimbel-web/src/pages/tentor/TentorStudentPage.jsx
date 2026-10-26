import React from "react";
import { Search, User } from "lucide-react";

export default function TentorStudentPage() {
  const students = [
    { id: "st1", name: "Ahmad Fauzan", nis: "STD001", className: "ONLINE-SMP-8A", attendanceRate: "95%" },
    { id: "st2", name: "Budi Santoso", nis: "STD002", className: "ONLINE-SMP-8A", attendanceRate: "88%" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Siswa Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Daftar peserta didik di kelas yang Anda ampu.</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari nama siswa..." className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500 shadow-sm" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase">
            <tr>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4">NIS</th>
              <th className="p-4">Kelas</th>
              <th className="p-4 text-center">Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-semibold">
            {students.map(st => (
              <tr key={st.id} className="hover:bg-slate-50">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black"><User size={14}/></div>
                  <span className="font-bold text-gray-900">{st.name}</span>
                </td>
                <td className="p-4 font-mono text-gray-500">{st.nis}</td>
                <td className="p-4 text-indigo-600">{st.className}</td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-black">{st.attendanceRate}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}