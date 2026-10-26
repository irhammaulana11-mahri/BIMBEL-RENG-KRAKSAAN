import { Eye,Pencil,Trash2,UserCheck,UserX,MessageCircle,UserPlus,CheckCircle, } from "lucide-react";
import React, {useMemo} from "react";
import { TableLoading,TableEmpty,TablePagination, } from "@/components/ui/table";

export default function ParentTable({
    parents = [],
    loading = false,
    pagination = null,
    onPageChange = () => {},
    onPreview = () => {},
    onEdit = () => {},
    onDelete = () => {},
}) {

  const renderRows = useMemo(() =>
    parents.map((parent) => (
      <tr key={parent.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">        
        <td className="px-6 py-4 font-bold text-gray-900 text-sm max-w-[180px] truncate">{parent.parent_name || parent.full_name}</td>
        <td className="px-6 py-4 text-gray-600 text-sm max-w-[240px] truncate" title={parent.address}>{parent.address || "-"}</td>
        <td className="px-4 py-4 text-center font-bold text-blue-600 text-sm whitespace-nowrap">{parent.students_count || "0"} Anak</td>
        <td className="px-4 py-4 text-gray-600 font-mono text-sm whitespace-nowrap">{parent.phone || parent.user?.phone || "-"}</td>
        <td className="px-4 py-4 text-gray-700 text-sm whitespace-nowrap">{parent.occupation || "Tidak Diisi"}</td>
        <td className="px-4 py-4 text-center whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              parent.user?.is_active
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {parent.user?.is_active ? (
              <UserCheck className="w-3.5 h-3.5" />
            ) : (
              <UserX className="w-3.5 h-3.5" />
            )}
            {parent.user?.is_active ? "Aktif" : "Nonaktif"}
          </span>
        </td>

        <td className="px-6 py-4 text-center w-32 whitespace-nowrap">
          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => onPreview(parent)}
              className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Buka Detail Rinci"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onEdit(parent)}
              className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
              title="Edit Profil Wali"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(parent.id)}
              className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
              title="Hapus Akun"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    )),
    [parents]
  );


  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
              <th className="px-6 py-4.5">Orang Tua - Wali</th>
              <th className="px-6 py-4.5">Alamat</th>
              <th className="px-6 py-4.5">Anak</th>
              <th className="px-6 py-4.5">No HP</th>
              <th className="px-6 py-4.5">Pekerjaan</th>
              <th className="w-32 px-6 py-4.5 text-center">Status</th>
              <th className="w-40 px-6 py-4.5 text-center">Aksi</th>
              </tr>
          </thead>

          {loading ? (
            <TableLoading colSpan={8} message="Memuat data, mohon ditunggu beberapa saat..."/>
          ) : parents.length === 0 ? (
            
            <TableEmpty colSpan={8}
              title="Belum ada data parents"
              description="Belum ada data parents terdaftar."
            />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
          
       </table>
      </div>
  
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data parents"/>
      )}
    </div>
  );
}
