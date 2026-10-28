import React from "react";
import { Pencil, Trash2, HelpCircle } from "lucide-react";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";

export default function FaqTable({ data, loading, onEdit, onDelete }) {
  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(data || []);

  return (
    <div className="max-w-full overflow-x-auto">
      <table className="ui-table w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5 w-16 text-center">Urutan</th>
            <th className="px-6 py-4.5">Tanya & Jawab (FAQ)</th>
            <th className="px-6 py-4.5 text-center w-32">Status</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {loading && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Sinkronisasi matriks tanya jawab...
                </div>
              </td>
            </tr>
          )}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                Belum ada data rekaman FAQ terdaftar.
              </td>
            </tr>
          )}

          {!loading && pageRows.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
              {/* Kolom Urutan Tampil */}
              <td className="px-6 py-4 text-center font-mono font-bold text-gray-900 text-base">
                #{item.sort_order ?? 1}
              </td>

              {/* Data Informasi FAQ */}
              <td className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">{item.question}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-gray-100/50">
                      {item.answer}
                    </p>
                  </div>
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

              {/* Blok Navigasi Aksi Kerja */}
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => onEdit(item)} 
                    className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                    title="Koreksi FAQ"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                    title="Hapus FAQ"
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