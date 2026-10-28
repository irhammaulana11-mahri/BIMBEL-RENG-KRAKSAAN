import React, { useMemo } from "react";
import { Eye, Pencil, Power, UserCheck, UserX, Calendar, BookOpen } from "lucide-react";
import { getAvatarColor } from "../../../utils/avatarColor";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table";

export default function TentorTable({ 
  tentors = [], 
  loading = false, 
  pagination = null,
  onPageChange = () => {},
  onPreview = () => {},
  onToggleStatus = () => {}, // 🟢 Ganti onDelete dengan onToggleStatus
}) {
  const renderRows = useMemo(() =>
    tentors.map((tentor) => {
      const isActive = tentor.user?.is_active ?? tentor.is_active ?? true;
      const avatarStyle = getAvatarColor(tentor.name || tentor.user?.name || "");
      const subjectCount = tentor.subjects_count ?? tentor.subjects?.length ?? 0;
      const activeSchedules = tentor.active_schedules_count ?? 0;

      return (
        <tr key={tentor.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">
          
          {/* 1. NAMA TENTOR & KONTAK */}
          <td className="px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${avatarStyle}`}>
                {tentor.name ? tentor.name.substring(0, 2).toUpperCase() : tentor.user?.name ? tentor.user.name.substring(0, 2).toUpperCase() : "TT"}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-950 text-sm max-w-[180px] truncate" title={tentor.name || tentor.user?.name}>
                  {tentor.name || tentor.user?.name}
                </span>
                <span className="text-xs font-mono text-gray-400 mt-0.5">
                  {tentor.phone || tentor.user?.phone || "-"}
                </span>
              </div>
            </div>
          </td>

          {/* 2. PENDIDIKAN & NIK */}
          <td className="px-6 py-3.5">
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-xs max-w-[180px] truncate" title={tentor.education}>
                {tentor.education || "S1 Pendidikan"}
              </span>
              <span className="text-[11px] font-mono text-gray-400 mt-0.5">
                NIK: {tentor.nik || "-"}
              </span>
            </div>
          </td>

          {/* 3. SPESIALISASI */}
          <td className="px-6 py-3.5 whitespace-nowrap">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200">
              {tentor.specialization || "SAINTEK"}
            </span>
          </td>

          {/* 4. MAPEL DIAMPU & SESSIONS */}
          <td className="px-6 py-3.5 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg border border-blue-100">
                <BookOpen size={12} /> {subjectCount} Mapel
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-100">
                <Calendar size={12} /> {activeSchedules} Sesi
              </span>
            </div>
          </td>

          {/* 5. STATUS */}
          <td className="px-4 py-3.5 text-center whitespace-nowrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          </td>

          {/* 6. AKSI */}
          <td className="px-6 py-3.5 text-center w-32 whitespace-nowrap">
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => onPreview(tentor)}
                className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                title="Buka Detail Tentor"
              >
                <Eye size={16} />
              </button>

              {/* 🟢 TOMBOL SWITCH TOGGLE STATUS (Menggantikan Delete) */}
              <button
                onClick={() => onToggleStatus(tentor)}
                className={`rounded-xl p-2 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
                title={isActive ? "Nonaktifkan Tentor" : "Aktifkan Tentor"}
              >
                <Power size={16} />
              </button>
            </div>
          </td>

        </tr>
      );
    }),
    [tentors, onPreview, onToggleStatus]
  );

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="ui-table w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3.5 text-left">Tentor & Kontak</th>
              <th className="px-6 py-3.5 text-left">Pendidikan & NIK</th>
              <th className="px-6 py-3.5 text-left whitespace-nowrap">Spesialisasi</th>
              <th className="px-6 py-3.5 text-left whitespace-nowrap">Pengampuan & Sesi</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
              <th className="px-6 py-3.5 text-center whitespace-nowrap w-32">Aksi</th>
            </tr>
          </thead>
          {loading ? (
            <TableLoading colSpan={6} message="Memuat data tentor, mohon ditunggu..." />
          ) : tentors.length === 0 ? (
            <TableEmpty colSpan={6} title="Belum ada data Tentor" description="Belum ada data tentor terdaftar di sistem." />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
        </table>
      </div>
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Tentor" />
      )}
    </div>
  );
}