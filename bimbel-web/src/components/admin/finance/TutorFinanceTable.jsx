import React from "react";
import { CheckCircle2, Landmark } from "lucide-react";

export default function TutorFinanceTable({ data, onOpenPayModal }) {
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <th className="p-5">Nama Tentor</th>
            <th className="p-5">Keahlian Modul</th>
            <th className="p-5 text-center">Total Sesi Ajar</th>
            <th className="p-5 text-right">Tarif / Sesi</th>
            <th className="p-5 text-right">Gaji Bulanan</th>
            <th className="p-5 text-center">Status Gaji</th>
            <th className="p-5 text-center">Aksi Kerja</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-5 font-bold text-gray-900">{row.tutor_name}</td>
              <td className="p-5 text-gray-500 font-medium">{row.specialty}</td>
              <td className="p-5 text-center font-bold text-purple-600">{row.total_teaching} Pertemuan</td>
              <td className="p-5 text-right font-mono text-gray-600">{formatIDR(row.rate_per_meeting)}</td>
              <td className="p-5 text-right font-mono font-bold text-emerald-600 text-base">{formatIDR(row.calculated_salary)}</td>
              <td className="p-5 text-center">
                {row.status === "paid" ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-600 rounded-md text-xs font-bold uppercase">Sudah Ditransfer</span>
                    <span className="text-[9px] text-gray-400 font-mono" title={`Ref: ${row.transfer_reference}`}>
                      {row.source_bank?.split(' ')[0]} | {row.transfer_date}
                    </span>
                  </div>
                ) : (
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-bold uppercase">Pending</span>
                )}
              </td>
              <td className="p-5 text-center">
                {row.status === "unpaid" || !row.status || row.status === "pending" ? (
                  <button
                    onClick={() => onOpenPayModal(row)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bayar Gaji
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 italic flex items-center justify-center gap-1">
                    <Landmark className="w-3 h-3 text-gray-300" /> Selesai payroll
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}