import React from "react";
import { X, Plus, BookOpen } from "lucide-react";

// API mengirim education_level sebagai objek relasi; ambil nama jenjangnya saja
const levelName = (s) =>
  s.education_level_name || s.education_level?.display_name ||
  (typeof s.education_level === "string" ? s.education_level : "");

export default function SelectedSubjectCards({ selectedSubjects = [], onRemove, onOpenModal }) {
  return (
    <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600" size={18} />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            3. Kompetensi Mata Pelajaran ({selectedSubjects.length})
          </h3>
        </div>

        {/* Tombol Buka Modal Picker */}
        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Plus size={14} /> Pilih Mata Pelajaran
        </button>
      </div>

      {/* Render Card Hasil Pilihan */}
      {selectedSubjects.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-gray-300 bg-white text-center space-y-2">
          <p className="text-xs font-semibold text-gray-500">Belum ada mata pelajaran yang dipilih.</p>
          <button
            type="button"
            onClick={onOpenModal}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            + Klik di sini untuk membuka katalog mapel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {selectedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between gap-2 group hover:border-blue-400 transition-all"
            >
              <div className="overflow-hidden space-y-0.5">
                <p className="font-bold text-gray-900 text-xs truncate">{sub.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                  <span className="font-mono">{sub.code || "MTK"}</span>
                  <span>•</span>
                  <span className="text-purple-600">{levelName(sub) || "SD"}</span>
                </div>
              </div>

              {/* Tombol Hapus Mapel */}
              <button
                type="button"
                onClick={() => onRemove(sub)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Hapus pilihan"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}