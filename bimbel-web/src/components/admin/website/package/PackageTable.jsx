import React from "react";
import { PACKAGE_CLASS_TYPES } from "./packageTypes";
import { Pencil, Trash2, Palette } from "lucide-react";

export default function PackageTable({ data, loading, onEdit, onDelete }) {
  
  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5">Nama Paket Program</th>
            <th className="px-6 py-4.5 text-center">Jenjang</th>
            <th className="px-6 py-4.5 text-right">Tarif Investasi</th>
            <th className="px-6 py-4.5 text-center">Sesi / Bulan</th>
            <th className="px-6 py-4.5">Metode KBM</th>
            <th className="px-6 py-4.5 text-center">Status</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {loading && (
            <tr>
              <td colSpan="7" className="py-12 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Memetakan tarif katalog produk belajar...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan="7" className="py-12 text-center text-gray-400 italic">
                Belum ada records master paket program bimbingan belajar.
              </td>
            </tr>
          )}

          {!loading && data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              {/* Nama Paket + Aksen warna representatif */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-white shadow-xs shrink-0 flex items-center justify-center text-[8px]"
                    style={{ backgroundColor: PACKAGE_CLASS_TYPES[item.class_type]?.color || "#2563eb" }}
                  >
                    <Palette className="w-2 h-2 text-white/40" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{item.package_name}</p>
                    <p className="text-xs text-gray-400 font-medium line-clamp-1 mt-0.5">{item.description || "Tanpa ringkasan info"}</p>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-5 text-center">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase">
                  {item.education_level}
                </span>
              </td>
              
              <td className="px-6 py-5 text-right font-mono font-bold text-gray-900 text-base">
                {formatIDR(item.default_price || 0)}
              </td>
              
              <td className="px-6 py-5 text-center">
                <div className="text-base font-bold text-gray-900">{item.meeting_per_month}x <span className="text-xs text-gray-400 font-medium">per bulan</span></div>
                <div className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">⏱️ {item.duration_minutes} Menit/Sesi</div>
              </td>
              
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-700">{PACKAGE_CLASS_TYPES[item.class_type]?.label || item.class_type || "-"}</span>
                </div>
              </td>

              <td className="px-6 py-5 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  item.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </td>

              <td className="px-6 py-5">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Koreksi Paket"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)} 
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus Paket"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}