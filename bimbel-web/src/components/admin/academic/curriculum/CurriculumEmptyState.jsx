import React from "react";
import { Layers, Plus } from "lucide-react";

export default function CurriculumEmptyState({ onAdd }) {
  return (
    <div className="p-8 text-center bg-slate-50/80 rounded-3xl border border-dashed border-gray-200 space-y-4 my-4">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
        <Layers size={22} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black text-gray-900">Belum ada struktur kurikulum</h4>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Susun bab dan topik pembelajaran berdasarkan semester untuk Mata Pelajaran ini.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        <Plus size={15} /> Buat Curriculum Pertama
      </button>
    </div>
  );
}