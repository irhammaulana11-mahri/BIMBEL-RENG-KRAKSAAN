import React from "react";
import { assetUrl } from "@/config/env";
import { Pencil, Trash2, Image } from "lucide-react";

export default function BannerTable({ data, loading, onEdit, onDelete }) {
  
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5 w-48">Visual Banner</th>
            <th className="px-6 py-4.5">Informasi & Subtitle</th>
            <th className="px-6 py-4.5 text-center w-24">Urutan</th>
            <th className="px-6 py-4.5 text-center">Periode Tayang</th>
            <th className="px-6 py-4.5 text-center w-36">Status</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {loading && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Menyinkronkan materi visual halaman web...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                Belum ada data banner terunggah.
              </td>
            </tr>
          )}

          {!loading && data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              {/* Kolom Pratinjau Gambar */}
              <td className="px-6 py-4">
                <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-gray-100 w-40 h-24 shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img 
                      src={assetUrl(item.image_url)}
                      className="w-full h-full object-cover"
                      alt={item.title || "Banner"}
                    />
                  ) : (
                    <Image className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </td>

              {/* Data Teks Konten */}
              <td className="px-6 py-4">
                <div className="font-bold text-gray-900 text-base leading-snug">{item.title || "-"}</div>
                <div className="text-xs text-gray-400 font-semibold mt-1 line-clamp-1">{item.subtitle || "Tidak ada deskripsi"}</div>
              </td>

              {/* Urutan Tampil */}
              <td className="px-6 py-4 text-center font-mono font-bold text-gray-900 text-base">
                #{item.sort_order ?? 0}
              </td>

              {/* Rentang Waktu Rilis */}
              <td className="px-6 py-4 text-center text-sm font-semibold text-gray-600 whitespace-nowrap">
                <div>{formatDate(item.start_date)}</div>
                <div className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">s/d {formatDate(item.end_date)}</div>
              </td>

              {/* Badge Status */}
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  item.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </td>

              {/* Opsi Kontrol Aksi Kerja */}
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Edit Konten Banner"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)} 
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus Banner"
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