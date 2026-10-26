import React, { useMemo } from "react";
import { Eye, Pencil, Power, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table";

export default function LocationTable({ 
  locations = [], 
  loading = false, 
  pagination = null,
  onPageChange = () => {},
  onPreview = () => {},
  onEdit = () => {},
  onToggleStatus = () => {}, // 🟢 Menggantikan onDelete
}) {
  
  const renderRows = useMemo(() =>
    locations.map((loc) => {
      const isActive = loc.is_active ?? true;

      return (
        <tr key={loc.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">
          
          {/* 1. KODE & NAMA LOKASI */}
          <td className="px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-950 text-sm max-w-[200px] truncate" title={loc.location_name}>
                  {loc.location_name}
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                  {loc.code || "LOC"}
                </span>
              </div>
            </div>
          </td>

          {/* 2. ALAMAT LENGKAP */}
          <td className="px-6 py-3.5">
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 text-sm max-w-[280px] truncate" title={loc.address}>
                {loc.address || "-"}
              </span>
              <span className="text-xs font-mono text-gray-400 mt-0.5">
                Koordinat: {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : "Belum di-set"}
              </span>
            </div>
          </td>

          {/* 3. RADIUS ABSENSI */}
          <td className="px-6 py-3.5 whitespace-nowrap">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono font-bold text-xs rounded-lg border border-slate-200">
              {loc.radius_meter || 100} Meter
            </span>
          </td>

          {/* 4. STATUS AKTIF / NONAKTIF */}
          <td className="px-4 py-3.5 text-center whitespace-nowrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          </td>

          {/* 5. AKSI */}
          <td className="px-6 py-3.5 text-center w-32 whitespace-nowrap">
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => onPreview(loc)}
                className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                title="Buka Detail Rinci Lokasi"
              >
                <Eye size={16} />
              </button>
              
              <button
                onClick={() => onEdit(loc)}
                className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Edit Lokasi"
              >
                <Pencil size={16} />
              </button>

              {/* 🟢 TOMBOL SWITCH TOGGLE STATUS (Menggantikan Tombol Hapus) */}
              <button
                onClick={() => onToggleStatus(loc)}
                className={`rounded-xl p-2 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
                title={isActive ? "Nonaktifkan Lokasi" : "Aktifkan Lokasi"}
              >
                <Power size={16} />
              </button>
            </div>
          </td>

        </tr>
      );
    }),
    [locations, onPreview, onEdit, onToggleStatus]
  );

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3.5 text-left">Kode & Nama Lokasi</th>
              <th className="px-6 py-3.5 text-left">Alamat & Koordinat</th>
              <th className="px-6 py-3.5 text-left whitespace-nowrap">Radius Absensi</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
              <th className="px-6 py-3.5 text-center whitespace-nowrap w-32">Aksi</th>
            </tr>
          </thead>
          {loading ? (
            <TableLoading colSpan={5} message="Memuat data lokasi, mohon ditunggu..." />
          ) : locations.length === 0 ? (
            <TableEmpty colSpan={5} title="Belum ada data Lokasi Bimbel" description="Belum ada data lokasi belajar terdaftar." />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
        </table>
      </div>
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Locations" />
      )}
    </div>
  );
}