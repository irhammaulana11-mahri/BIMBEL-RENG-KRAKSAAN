import React from "react";
import { Calendar, User } from "lucide-react";

export default function ArticlePreview({ form }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
      <div className="h-48 bg-slate-50 border-b border-gray-100 relative flex items-center justify-center overflow-hidden">
        {form.featured_image ? (
          <img src={form.featured_image} alt="Cover Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm font-bold text-gray-400 italic">Belum ada media tersemat</div>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-lg font-black text-gray-950 leading-snug line-clamp-2 mb-2">
          {form.title || "Judul Rilis Utama Artikel"}
        </h2>

        <div className="flex gap-4 text-xs text-gray-400 font-semibold mb-4 border-b border-gray-50 pb-2">
          <span className="flex gap-1 items-center font-mono">
            <Calendar size={13} />
            {form.publish_date ? (form.publish_date instanceof Date ? form.publish_date : new Date(form.publish_date)).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
          </span>

          <span className="flex gap-1 items-center uppercase">
            <User size={13} /> Staf Penulis
          </span>
        </div>

        <p className="text-gray-600 text-xs font-medium leading-relaxed line-clamp-3">
          {form.summary || "Lead ringkasan paragraf pembuka artikel akan muncul secara real-time di sini..."}
        </p>
      </div>
    </div>
  );
}