import React from "react";
import { FileText, Lock, Edit3, Trash2, DownloadCloud } from "lucide-react";

export default function MaterialListTable({ data, onEdit, onDelete }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
            <th className="px-6 py-4.5">Judul Modul & Dokumen</th>
            <th className="px-6 py-4.5">Mata Pelajaran</th>
            <th className="px-6 py-4.5">Proteksi Hak Akses Paket</th>
            <th className="px-6 py-4.5 text-center w-36">Volume Unduhan</th>
            <th className="px-6 py-4.5 text-center w-36">Aksi Kerja</th>
          </tr>
        </thead>
        {/* ISI DATA DIUBAH KE TEXT-BASE FONT-BOLD UNTUK MENGACU STANDARISASI */}
        <tbody className="divide-y divide-gray-50 text-base text-gray-700 font-medium">
          {data.length === 0 ? (
            <tr>
              <td colSpan="5" className="py-12 text-center text-gray-400 italic">Tidak ada data berkas modul materi ditemukan.</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      {/* Judul Modul text-base font-bold */}
                      <p className="font-bold text-gray-900 leading-tight text-base">{row.title}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1 font-medium">{row.file_name} ({row.file_size})</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="font-bold text-gray-800 text-base">{row.subject_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-semibold">Tingkat: {row.education_level}</p>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    {row.allowed_package_name}
                  </span>
                </td>
                <td className="px-6 py-5 text-center text-gray-900 font-bold font-mono text-base">
                  <span className="flex items-center justify-center gap-1">
                    <DownloadCloud className="w-4 h-4 text-gray-400 shrink-0" /> {row.download_count}x
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(row)}
                      className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors"
                      title="Edit Judul / Akses Paket"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(row.id)}
                      className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                      title="Hapus Modul Dokumen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}