import React from "react";
import { LoaderCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function MiniDataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "Data tidak ditemukan.",
  pagination = null, // { currentPage, totalPages, totalItems, itemsPerPage, onPageChange }
}) {
  return (
    <div className="space-y-3">
      {/* Tabel Container */}
      <div className="overflow-x-auto border border-gray-100 rounded-2xl bg-white shadow-2xs">
        <table className="ui-table w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-400">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 ${col.headerAlign ? `text-${col.headerAlign}` : "text-left"} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-blue-600">
                  <LoaderCircle className="h-7 w-7 animate-spin mx-auto mb-2" />
                  <span className="text-xs font-semibold text-gray-400">Memuat data...</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400 italic text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-blue-50/30 transition-colors group">
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-3 ${col.align ? `text-${col.align}` : "text-left"} ${col.cellClassName || ""}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.accessor] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Reusable (Jika diset) */}
      {pagination && (
        <div className="pt-2 flex items-center justify-between text-xs">
          <p className="text-gray-500 font-medium">
            Menampilkan{" "}
            <span className="font-bold text-gray-900">
              {pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-bold text-gray-900">
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            </span>{" "}
            dari <span className="font-bold text-gray-900">{pagination.totalItems}</span> data
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}