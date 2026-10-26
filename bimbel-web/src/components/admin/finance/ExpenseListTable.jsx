import React from "react";
import { Trash2, Landmark, Tag } from "lucide-react";

export default function ExpenseListTable({ data, onDelete }) {
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/30 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th className="p-4">Tanggal / Kategori</th>
            <th className="p-4">Detail Keterangan Biaya</th>
            <th className="p-4 text-right">Nominal Biaya</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-6 text-center text-gray-400">Tidak ada pengeluaran operasional terdaftar bulan ini.</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{row.date}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium mt-1">
                    <Tag className="w-2.5 h-2.5" /> {row.category}
                  </span>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-gray-800 text-sm">{row.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Catatan: {row.note || "-"}</p>
                </td>
                <td className="p-4 text-right font-mono font-bold text-red-600 text-sm">
                  -{formatIDR(row.amount)}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => onDelete(row.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Log Kas Keluar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}