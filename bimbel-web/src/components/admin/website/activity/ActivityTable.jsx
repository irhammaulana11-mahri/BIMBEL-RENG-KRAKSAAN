import React from "react";
import { assetUrl } from "@/config/env";
import { Pencil, Trash2, MapPin, Calendar, Image } from "lucide-react";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";

export default function ActivityTable({ data, loading, onEdit, onDelete }) {
  
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(data || []);

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="ui-table w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5 w-48">Media Sampul</th>
            <th className="px-6 py-4.5">Informasi Kegiatan</th>
            <th className="px-6 py-4.5 w-56">Lokasi / Tempat</th>
            <th className="px-6 py-4.5 text-center w-40">Tanggal Pelaksanaan</th>
            <th className="px-6 py-4.5 text-center w-32">Status</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {loading && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Memuat matriks album dokumentasi...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                Belum ada records dokumentasi kegiatan terbit.
              </td>
            </tr>
          )}

          {!loading && pageRows.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              <td className="px-6 py-4">
                <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-gray-100 w-40 h-24 shrink-0 flex items-center justify-center">
                  {item.cover_image ? (
                    <img 
                      src={assetUrl(item.cover_image)}
                      className="w-full h-full object-cover"
                      alt={item.title}
                    />
                  ) : (
                    <Image className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </td>
              
              <td className="px-6 py-4">
                <div className="font-bold text-gray-900 text-base leading-snug">{item.title}</div>
                <div className="text-xs text-gray-400 font-semibold mt-1 line-clamp-2 leading-relaxed">{item.description}</div>
              </td>
              
              <td className="px-6 py-4 text-gray-800 text-sm font-bold">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="line-clamp-2 font-semibold text-gray-700">{item.location || "-"}</span>
                </div>
              </td>
              
              <td className="px-6 py-4 text-center text-sm font-semibold text-gray-600 whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-gray-600 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(item.activity_date)}
                </div>
              </td>
              
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  item.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </td>
              
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Koreksi Data Kegiatan"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)} 
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus Kegiatan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination pagination={pagination} onPageChange={onPageChange} label="data" />
    </div>
  );
}