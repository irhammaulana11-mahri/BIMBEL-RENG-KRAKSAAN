import React, { useState, useEffect, useRef } from "react";
import { Eye, Pencil, MoreVertical, Power, Copy, CheckCircle2, UserCheck, UserX, Laptop, Home, Building2,Users } from "lucide-react";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table";

export default function ClassTable({ 
  classes = [], 
  loading = false, 
  pagination = null,
  onPageChange = () => {},
  onPreview = () => {},
  onEdit = () => {},
  onToggleStatus = () => {},
  onDuplicate = () => {},
  onChangeProgressStatus = () => {},
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Auto close menu saat klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderTypeBadge = (type) => {
    const t = String(type || "").toUpperCase();
    if (t === "PRIVATE" || t === "RUMAH") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Home size={12} /> Private</span>;
    }
    if (t === "ONLINE") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"><Laptop size={12} /> Online</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Building2 size={12} /> Reguler</span>;
  };

  return (
    <div className="border border-gray-200 bg-white shadow-2xs rounded-xl relative">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3.5 text-left">Kelas</th>
              <th className="px-6 py-3.5 text-left">Jenis</th>
              <th className="px-6 py-3.5 text-left">Jenjang</th>
              <th className="px-6 py-3.5 text-left">Kapasitas</th>
              <th className="px-6 py-3.5 text-left">Progress</th>
              <th className="px-4 py-3.5 text-center">Keaktifan</th>
              <th className="px-6 py-3.5 text-center w-28">Aksi</th>
            </tr>
          </thead>
          {loading ? (
            <TableLoading colSpan={7} message="Memuat data kelas..." />
          ) : classes.length === 0 ? (
            <TableEmpty colSpan={7} title="Belum ada data Kelas" description="Belum ada kelas terdaftar di sistem." />
          ) : (
            <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
              {classes.map((item, index) => {
                const isActive = item.is_active ?? true;
                const studentCount = item.students_count ?? item.students?.length ?? 0;
                const isLastRows = index >= classes.length - 2 && classes.length > 2;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-950 text-sm truncate max-w-[200px]" title={item.name}>{item.name}</span>
                        <span className="text-xs font-mono font-bold text-blue-600 mt-0.5">{item.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">{renderTypeBadge(item.class_type)}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-lg">
                        {item.display_name || item.education_level || "SD"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <Users size={13} className="text-blue-600" /> {studentCount}/{item.max_students || 10}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-mono font-bold text-xs rounded-lg border border-amber-200">
                        {item.status || "ON_PROGRESS"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        {isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center w-28 whitespace-nowrap relative">
                      <div className="flex justify-center gap-1 items-center">
                        <button onClick={() => onPreview(item)} className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Preview Detail">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => onEdit(item)} className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer" title="Edit Kelas">
                          <Pencil size={16} />
                        </button>
                        
                        {/* Menu Titik Tiga Dropdown dengan Posisi Mengambang Aman */}
                        <div className="relative" ref={activeMenuId === item.id ? menuRef : null}>
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)} 
                            className="rounded-xl bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === item.id && (
                            <div className={`absolute right-0 ${
                              isLastRows ? "bottom-full mb-2" : "top-full mt-2"
                            } w-44 bg-white shadow-2xl rounded-2xl border border-gray-100 p-1.5 z-50 text-left space-y-0.5 animate-in fade-in`}>
                              <button 
                                onClick={() => { onDuplicate(item); setActiveMenuId(null); }} 
                                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <Copy size={14} /> Duplicate Class
                              </button>
                              <button 
                                onClick={() => { onToggleStatus(item); setActiveMenuId(null); }} 
                                className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <Power size={14} /> {isActive ? "Non-Aktifkan" : "Aktifkan"}
                              </button>
                              <button 
                                onClick={() => { onChangeProgressStatus(item, "SELESAI"); setActiveMenuId(null); }} 
                                className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 size={14} /> Set Selesai
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
      {pagination && <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Kelas" />}
    </div>
  );
}