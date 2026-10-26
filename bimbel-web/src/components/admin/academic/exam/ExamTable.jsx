import React from "react";
import { Pencil, Trash2, HelpCircle, ClipboardList, Clock } from "lucide-react";

export default function ExamTable({ data, onEdit, onDelete, onManageQuestions, onViewResults }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
            <th className="p-6">Detail Ujian</th>
            <th className="p-6">Mata Pelajaran</th>
            <th className="p-6">Pembuat / Tentor</th>
            <th className="p-6 text-center">Durasi & Nilai</th>
            <th className="p-6 text-center">Opsi Akademik</th>
            <th className="p-6 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-6 text-center text-gray-400">Belum ada modul kuis / ujian yang dibuat.</td>
            </tr>
          ) : (
            data.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                {/* Kolom 1: Judul & Tanggal */}
                <td className="p-6">
                  <p className="font-bold text-gray-900">{exam.title}</p>
                  <p className="text-xs text-gray-400 mt-1">Tanggal: {exam.exam_date || "-"}</p>
                </td>
                {/* Kolom 2: Mapel */}
                <td className="p-6">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                    {exam.subject_name || "Mata Pelajaran"}
                  </span>
                </td>
                {/* Kolom 3: Tentor */}
                <td className="p-6 font-medium text-gray-800">{exam.tutor_name || "Sistem"}</td>
                {/* Kolom 4: Durasi & Target Skor */}
                <td className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {exam.duration} Menit
                    </span>
                    <span className="text-xs font-bold text-gray-700 mt-1">Max Score: {exam.total_score}</span>
                  </div>
                </td>
                {/* Kolom 5: Tombol Navigasi Manajemen Soal & Nilai */}
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onManageQuestions(exam)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors"
                      title="Kelola bank soal ujian ini"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Soal
                    </button>
                    <button
                      onClick={() => onViewResults(exam)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                      title="Lihat hasil pengerjaan siswa"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Hasil
                    </button>
                  </div>
                </td>
                {/* Kolom 6: Aksi Hapus/Edit Master Kuis */}
                <td className="p-6">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onEdit(exam)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit Kuis"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(exam.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus Kuis"><Trash2 className="w-4 h-4" /></button>
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