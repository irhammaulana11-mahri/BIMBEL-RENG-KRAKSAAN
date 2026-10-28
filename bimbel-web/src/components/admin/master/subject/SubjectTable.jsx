import { Eye,Pencil,Trash2,UserCheck,UserX,MessageCircle,UserPlus,CheckCircle,Power } from "lucide-react";
import React, {useMemo} from "react";
import { TableLoading,TableEmpty,TablePagination, } from "@/components/ui/table";


export default function SubjectTable({ 
    subjects = [],
    loading = false,
    pagination = null,
    onPageChange = () => {},
    onPreview = () => {},
    onEdit = () => {},
    // onDelete = () => {},
    onToggleStatus = () => {},
}) {

  const renderRows = useMemo(() =>
    subjects.map((subject) => (
      <tr key={subject.id} className="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">        
        <td className="px-6 py-3.5">
          <div className="flex flex-col">
            <span className="font-bold text-gray-950 text-sm max-w-[180px] truncate" title={subject.code}>
              {subject.code}
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 mt-0.5">
              {subject.name || "-"}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-gray-600 text-sm max-w-[240px] truncate" title={subject.description}>{subject.description || "-"}</td>
        <td className="px-4 py-4 text-center font-bold text-blue-600 text-sm whitespace-nowrap">{subject.education_level_name || "-"}</td>
        <td className="px-4 py-4 text-center whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              subject.is_active
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {subject.is_active ? (
              <UserCheck className="w-3.5 h-3.5" />
            ) : (
              <UserX className="w-3.5 h-3.5" />
            )}
            {subject.is_active ? "Aktif" : "Nonaktif"}
          </span>
        </td>

        <td className="px-6 py-4 text-center w-32 whitespace-nowrap">
          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => onPreview(subject)}
              className="rounded-xl bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Buka Detail"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onEdit(subject)}
              className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
              title="Edit Data"
            >
              <Pencil size={16} />
            </button>
            {/* <button
              onClick={() => onDelete(subject.id)}
              className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
              title="Hapus Data"
            >
              <Trash2 size={16} />
            </button> */}
            <button
              onClick={() => onToggleStatus(subject)}
              className={`rounded-xl p-2 transition-colors cursor-pointer ${
                subject.is_active
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
              title={subject.is_active ? "Nonaktifkan Mapel" : "Aktifkan Mapel"}
            >
              <Power size={16} />
            </button>
          </div>
        </td>
      </tr>
    )),
    [subjects]
  );



  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="ui-table w-full border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
              <th className="px-6 py-4.5 w-72">Mata Pelajaran</th>
              <th className="px-6 py-4.5">Deskripsi / Ruang Lingkup</th>
              <th className="px-6 py-4.5 text-center w-48">Jenjang</th>
              <th className="px-6 py-4.5 text-center w-36">Status</th>
              <th className="px-6 py-4.5 text-center w-36">Aksi</th>
            </tr>
          </thead>

          {loading ? (
            <TableLoading colSpan={8} message="Memuat data, mohon ditunggu beberapa saat..."/>
          ) : subjects.length === 0 ? (
            
            <TableEmpty colSpan={8}
              title="Belum ada data subjects"
              description="Belum ada data subjects terdaftar."
            />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
          
       </table>
      </div>
  
      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data subjects"/>
      )}
    </div>
  );
}
