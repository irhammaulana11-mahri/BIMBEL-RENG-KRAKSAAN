import React from "react";
import { Pencil, Trash2, Eye, User, Image } from "lucide-react";

export default function ArticleTable({ data, loading, onEdit, onDelete }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5">Materi Artikel</th>
            <th className="px-6 py-4.5 w-48">Kategori</th>
            <th className="px-6 py-4.5 w-44">Penulis</th>
            <th className="px-6 py-4.5 text-center w-28">Views</th>
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
                  Mengompilasi berkas literasi artikel...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                Belum ada data artikel terbit atau draft yang tersimpan.
              </td>
            </tr>
          )}

          {!loading && data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              <td className="px-6 py-4">
                <div className="flex gap-4 items-start">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-gray-100 w-28 h-20 shrink-0 flex items-center justify-center">
                    {item.featured_image ? (
                      <img 
                        src={`http://127.0.0.1:8001${item.featured_image}`} 
                        className="w-full h-full object-cover"
                        alt={item.title}
                      />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1 line-clamp-2 leading-relaxed">{item.summary || "Tidak ada ringkasan"}</p>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-wrap gap-1">
                  {item.categories && item.categories.length > 0 ? (
                    item.categories.map((cat) => (
                      <span key={cat.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        {cat.category_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">Tanpa Kategori</span>
                  )}
                </div>
              </td>

              <td className="px-6 py-4 text-sm text-gray-700">
                <div className="flex items-center gap-1.5 font-semibold">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{item.author?.name || "Staf Admin"}</span>
                </div>
              </td>

              <td className="px-6 py-4 text-center font-mono font-bold text-gray-900 text-base">
                <div className="inline-flex items-center gap-1 justify-center text-gray-600">
                  <Eye className="w-4 h-4 text-gray-400" />
                  {item.view_count ?? 0}
                </div>
              </td>

              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  item.is_published ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {item.is_published ? "Published" : "Draft"}
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Koreksi Naskah Artikel"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)} 
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus Artikel"
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