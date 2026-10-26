import React from "react";
import { HelpCircle } from "lucide-react";

export default function FaqPreview({ form }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/70">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview Akordion</h3>
      </div>
      <div className="p-5">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          {/* Header Pertanyaan */}
          <div className="bg-blue-600 px-4 py-3 font-bold text-white text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle size={15} className="shrink-0" />
              <span>{form.question || "Judul Pertanyaan FAQ Masih Kosong"}</span>
            </div>
            <span className="text-xs opacity-80 font-mono">#{form.sort_order || 1}</span>
          </div>
          {/* Isi Jawaban */}
          <div className="p-4 text-xs font-medium leading-relaxed text-gray-600 bg-white min-h-[80px]">
            {form.answer || "Uraian penjelasan jawaban operasional lembaga akan ter-render secara real-time di bagian ini..."}
          </div>
        </div>
      </div>
    </div>
  );
}