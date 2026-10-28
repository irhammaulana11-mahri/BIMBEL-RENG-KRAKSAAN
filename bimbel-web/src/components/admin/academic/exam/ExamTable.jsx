import React from "react";
import { Pencil, Trash2, HelpCircle, ClipboardList, Clock, Send, Archive, CalendarClock } from "lucide-react";

const STATUS_BADGE = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-green-50 text-green-700",
  ARCHIVED: "bg-amber-50 text-amber-700",
};

const STATUS_LABEL = { DRAFT: "Draft", PUBLISHED: "Terbit", ARCHIVED: "Arsip" };

export default function ExamTable({ data, onEdit, onDelete, onManageQuestions, onViewResults, onChangeStatus }) {
  return (
    <div className="overflow-x-auto">
      <table className="ui-table w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
            <th className="p-6">Detail Ujian</th>
            <th className="p-6">Mata Pelajaran</th>
            <th className="p-6 text-center">Durasi & Soal</th>
            <th className="p-6 text-center">Status</th>
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
                {/* Kolom 1: Judul & Jadwal */}
                <td className="p-6">
                  <p className="font-bold text-gray-900">{exam.title}</p>
                  <p className="text-xs text-gray-400 mt-1">Tentor: {exam.tutor_name || "Admin"}</p>
                  {exam.is_scheduled ? (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {exam.opens_at?.replace("T", " ")} – {exam.closes_at?.replace("T", " ")} WIB
                      {exam.class_names?.length > 0 && <span className="text-gray-400">• {exam.class_names.join(", ")}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Dijalankan saat sesi KBM</p>
                  )}
                </td>
                {/* Kolom 2: Mapel */}
                <td className="p-6">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                    {exam.subject_name || "Mata Pelajaran"}
                  </span>
                </td>
                {/* Kolom 3: Durasi & Jumlah Soal */}
                <td className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {exam.duration} Menit
                    </span>
                    <span className="text-xs font-bold text-gray-700 mt-1">{exam.questions_count ?? 0} Soal • Skala {exam.total_score}</span>
                  </div>
                </td>
                {/* Kolom 4: Status */}
                <td className="p-6 text-center">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_BADGE[exam.status] || STATUS_BADGE.DRAFT}`}>
                    {STATUS_LABEL[exam.status] || exam.status}
                  </span>
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
                      className="relative inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                      title="Lihat hasil pengerjaan siswa"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Hasil ({exam.results_count ?? 0})
                      {exam.pending_count > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] rounded-full px-1.5" title="Menunggu penilaian essay">{exam.pending_count}</span>
                      )}
                    </button>
                  </div>
                </td>
                {/* Kolom 6: Aksi */}
                <td className="p-6">
                  <div className="flex items-center justify-center gap-1">
                    {exam.status !== "PUBLISHED" && (
                      <button onClick={() => onChangeStatus(exam, "PUBLISHED")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Terbitkan"><Send className="w-4 h-4" /></button>
                    )}
                    {exam.status === "PUBLISHED" && (
                      <button onClick={() => onChangeStatus(exam, "ARCHIVED")} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Arsipkan"><Archive className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => onEdit(exam)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit Ujian"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(exam)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus Ujian"><Trash2 className="w-4 h-4" /></button>
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
