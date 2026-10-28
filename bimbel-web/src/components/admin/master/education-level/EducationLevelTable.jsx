import React, { useMemo } from "react";
import { Pencil, Power, PowerOff, CheckCircle, XCircle } from "lucide-react";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table"; // Sesuaikan path komponen global

export default function EducationLevelTable({
  data = [],
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onEdit = () => {},
  onToggleStatus = () => {},
}) {
  const renderRows = useMemo(
    () =>
      data.map((item) => (
        <tr
          key={item.id}
          className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0"
        >
          {/* Kolom Gabungan Display Name & Kode */}
          <td className="px-6 py-3.5">
            <div className="flex flex-col">
              <span
                className="font-bold text-gray-950 text-sm max-w-[200px] truncate"
                title={item.display_name}
              >
                {item.display_name}
              </span>
              <span className="text-xs font-mono font-bold text-gray-400 mt-0.5">
                {item.level_code || "-"}
              </span>
            </div>
          </td>

          {/* Kolom Jenjang */}
          <td className="px-6 py-4 text-gray-600 text-sm font-semibold whitespace-nowrap">
            {item.education_level || "-"}
          </td>

          {/* Kolom Grade */}
          <td className="px-6 py-4 text-center font-bold text-blue-600 text-sm whitespace-nowrap">
            {item.grade_level || "-"}
          </td>

          {/* Kolom Deskripsi */}
          <td className="px-6 py-4 text-left font-normal text-600 text-sm whitespace-nowrap">
            {item.description || "-"}
          </td>

          {/* Kolom Status */}
          <td className="px-6 py-4 text-center whitespace-nowrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                item.is_active
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {item.is_active ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {item.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </td>

          {/* Kolom Aksi */}
          <td className="px-6 py-4 text-center w-32 whitespace-nowrap">
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => onEdit(item)}
                className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Edit Data"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onToggleStatus(item)}
                className={`rounded-xl p-2 transition-colors cursor-pointer ${
                    item.is_active
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
                title={item.is_active ? "Nonaktifkan Education Level" : "Aktifkan Education Level"}
              >
              <Power size={16} />
                </button>
              
            </div>
          </td>
        </tr>
      )),
    [data, onEdit, onToggleStatus]
  );

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="ui-table w-full border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
              <th className="px-6 py-4.5 w-72">Nama Tampilan & Kode</th>
              <th className="px-6 py-4.5">Jenjang</th>
              <th className="px-6 py-4.5 text-center w-32">Tingkat</th>
              <th className="px-6 py-4.5">Deskripsi</th>
              <th className="px-6 py-4.5 text-center w-36">Status</th>
              <th className="px-6 py-4.5 text-center w-36">Aksi</th>
            </tr>
          </thead>

          {loading ? (
            <TableLoading
              colSpan={5}
              message="Memuat data, mohon ditunggu beberapa saat..."
            />
          ) : data.length === 0 ? (
            <TableEmpty
              colSpan={5}
              title="Belum ada data Education Level"
              description="Belum ada data Education Level yang terdaftar."
            />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
        </table>
      </div>

      {pagination && (
        <TablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          label="data Education Level"
        />
      )}
    </div>
  );
}