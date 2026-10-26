import React from "react";
// Perbaikan: Menghapus EyeCheck yang tidak ada di library lucide-react
import { Send, ClipboardCheck } from "lucide-react";

export default function ParentFinanceTable({ data, onSendInvoice, onOpenVerify }) {
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const renderStatus = (row) => {
    if (row.status === "paid") {
      return (
        <div className="flex flex-col items-center">
          <span className="px-2.5 py-0.5 bg-green-50 text-green-600 rounded-md text-xs font-bold uppercase">Lunas</span>
        </div>
      );
    }
    if (row.status === "rejected") {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-bold uppercase">Direject</span>
          <span className="text-[10px] text-red-400 font-medium max-w-[120px] truncate text-center" title={row.reject_reason}>
            {row.reject_reason}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-xs font-bold uppercase">Belum Bayar</span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th className="p-5">Wali Murid / Siswa</th>
            <th className="p-5">Paket Terpilih</th>
            <th className="p-5 text-center">Kehadiran Valid</th>
            <th className="p-5 text-right">Total Tagihan</th>
            <th className="p-5 text-center">Status</th>
            <th className="p-5 text-center">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-5">
                <p className="font-bold text-gray-900">{row.parent_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Siswa: {row.student_name}</p>
              </td>
              <td className="p-5">
                <p className="font-medium text-gray-800">{row.package_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Base: {formatIDR(row.base_price)}</p>
              </td>
              <td className="p-5 text-center font-bold text-blue-600">{row.actual_attendance} Sesi</td>
              <td className="p-5 text-right font-mono font-bold text-gray-900">{formatIDR(row.calculated_bill)}</td>
              <td className="p-5 text-center">{renderStatus(row)}</td>
              <td className="p-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onSendInvoice(row)}
                    className="px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs rounded-xl flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Invoice
                  </button>
                  {row.status !== "paid" && (
                    <button
                      onClick={() => onOpenVerify(row)}
                      className="px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" /> Verifikasi
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}