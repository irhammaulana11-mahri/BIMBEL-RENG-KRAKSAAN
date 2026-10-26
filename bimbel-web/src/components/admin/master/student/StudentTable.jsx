import { Eye,Pencil,Trash2,UserCheck,UserX,MessageCircle,UserPlus,CheckCircle, } from "lucide-react";
import React, {useMemo} from "react";
import { TableLoading,TableEmpty,TablePagination, } from "@/components/ui/table";

export default function StudentTable({
    students = [],
    loading = false,
    pagination = null,
    onPageChange = () => {},
    onPreview = () => {},
    onEdit = () => {},
    onDelete = () => {},
}) {

  const renderRows = useMemo(() =>
  students.map((student) => (
    <tr key={student.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">        
      
      {/* 1. NAMA & NIS (Stacked Rapi) */}
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <span className="font-bold text-gray-950 text-sm max-w-[180px] truncate" title={student.student_name || student.full_name}>
            {student.student_name || student.full_name}
          </span>
          <span className="text-xs font-mono font-bold text-gray-400 mt-0.5">
            {student.nis || "-"}
          </span>
        </div>
      </td>

      {/* 2. SEKOLAH & JENJANG / KELAS */}
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm max-w-[200px] truncate" title={student.school_name}>
            {student.school_name || "-"}
          </span>
          <span className="text-xs font-semibold text-gray-500 mt-0.5">
            {student.education_level || "-"} {student.grade ? `• Kelas ${student.grade}` : ""}
          </span>
        </div>
      </td>

      {/* 3. ORANG TUA / WALI & HUBUNGAN */}
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm max-w-[180px] truncate" title={student.parent?.full_name || student.parent?.parent_name}>
            {student.parent?.full_name || student.parent?.parent_name || "-"}
          </span>
          <span className="text-xs font-semibold text-blue-600 capitalize mt-0.5">
            {student.parent?.relationship || "Wali Murid"}
          </span>
        </div>
      </td>

      {/* 4. ALAMAT */}
      <td className="px-6 py-3.5">
        <p className="text-sm font-medium text-gray-600 max-w-[220px] truncate" title={student.parent?.address || student.address}>
          {student.parent?.address || student.address || "-"}
        </p>
      </td>

      {/* 5. STATUS */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            student.is_active
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {student.is_active ? (
            <UserCheck className="w-3.5 h-3.5" />
          ) : (
            <UserX className="w-3.5 h-3.5" />
          )}
          {student.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </td>

      {/* 6. AKSI */}
      <td className="px-6 py-3.5 text-center w-32 whitespace-nowrap">
        <div className="flex justify-center gap-1.5">
          <button
            onClick={() => onPreview(student)}
            className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
            title="Buka Detail Rinci"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEdit(student)}
            className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Edit Data Murid"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(student.id)}
            className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            title="Hapus Data"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>

    </tr>
  )),
  [students]
);


  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
              <th className="px-6 py-4.5">Nama - NIS</th>
              <th className="px-6 py-4.5">Sekolah - Kelas</th>
              <th className="px-6 py-4.5">Orang Tua - Wali</th>
              <th className="px-6 py-4.5">Alamat</th>
              <th className="w-32 px-6 py-4.5 text-center">Status</th>
              <th className="w-40 px-6 py-4.5 text-center">Aksi</th>
              </tr>
          </thead>

          {loading ? (
            <TableLoading colSpan={8} message="Memuat data, mohon ditunggu beberapa saat..."/>
          ) : students.length === 0 ? (
            
            <TableEmpty colSpan={8}
              title="Belum ada data students"
              description="Belum ada data students terdaftar."
            />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
          
       </table>
      </div>
  
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data students"/>
      )}
    </div>
  );
}
