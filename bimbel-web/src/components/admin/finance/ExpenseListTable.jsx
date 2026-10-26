import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatRupiah } from "@/utils/format";

export default function ExpenseListTable({ data, loading, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[680px]">
        <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
          <tr><th className="p-4">Tanggal</th><th className="p-4">Kategori</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Aksi</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={5} className="p-6 text-center text-gray-400">Memuat pengeluaran...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada pengeluaran operasional pada periode ini.</td></tr>
          ) : data.map(item => (
            <tr key={item.id} className="hover:bg-gray-50/50">
              <td className="p-4 text-gray-600">{item.expense_date}</td>
              <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">{item.category_label}</span></td>
              <td className="p-4">
                <p className="font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400">{item.payment_method === "CASH" ? "Tunai" : "Transfer"}{item.note ? ` • ${item.note}` : ""}</p>
              </td>
              <td className="p-4 text-right font-bold text-rose-700">{formatRupiah(item.amount)}</td>
              <td className="p-4">
                <div className="flex justify-center gap-1">
                  <button onClick={() => onEdit(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
