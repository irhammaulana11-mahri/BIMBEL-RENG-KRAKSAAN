import React from "react";
import { Pencil, Trash2, Star } from "lucide-react";

export default function TestimonialTable({ data, loading, onEdit, onDelete }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5 w-24 text-center">Profil</th>
            <th className="px-6 py-4.5">Informasi Siswa & Ulasan</th>
            <th className="px-6 py-4.5 text-center w-36">Apresiasi Rating</th>
            <th className="px-6 py-4.5 text-center w-32">Status</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {loading && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Sinkronisasi lembar apresiasi siswa...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={5} className="py-12 text-center text-gray-400 italic">
                Belum ada data rekaman testimoni terdaftar.
              </td>
            </tr>
          )}

          {!loading && data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              {/* Foto Profil */}
              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <img 
                    src={item.photo_url ? `http://127.0.0.1:8001${item.photo_url}` : "https://ui-avatars.com/api/?name=Student"}
                    alt={item.student_name} 
                    className="w-14 h-14 rounded-full border border-gray-100 object-cover shadow-xs bg-slate-50 shrink-0"
                  />
                </div>
              </td>

              {/* Data Informasi Utama */}
              <td className="px-6 py-4">
                <h3 className="font-bold text-gray-900 text-base leading-snug">{item.student_name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase mt-0.5 tracking-wide">{item.school_name || "Alumni Cabang"}</p>
                <p className="text-xs text-gray-600 font-medium mt-2 leading-relaxed line-clamp-2 bg-slate-50/70 p-2.5 rounded-xl border border-gray-100/50 italic">
                  "{item.testimonial}"
                </p>
              </td>

              {/* Tampilan Rating Bintang */}
              <td className="px-6 py-4">
                <div className="flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star 
                      key={index} 
                      size={14} 
                      className={`${index < Number(item.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
              </td>

              {/* Badge Status Aktif/Nonaktif */}
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  item.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </td>

              {/* Blok Navigasi Aksi */}
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Edit Ulasan"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus Ulasan"
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