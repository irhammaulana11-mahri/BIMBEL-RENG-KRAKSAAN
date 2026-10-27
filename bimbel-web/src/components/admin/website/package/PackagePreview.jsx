import React from "react";
import { PACKAGE_CLASS_TYPES } from "./packageTypes";

export default function PackagePreview({ form }) {
  return (
    <div 
      className="rounded-3xl p-6 text-white shadow-md relative overflow-hidden min-h-[340px] flex flex-col justify-between transition-all duration-300 border border-white/5" 
      style={{ backgroundColor: PACKAGE_CLASS_TYPES[form.class_type]?.color || "#2563eb" }}
    >
      {/* Lapisan Aksen Estetika Lingkaran Khas Mobile App */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
      
      <div>
        <div className="flex justify-between items-start gap-2 relative z-10">
          <div>
            <h3 className="text-2xl font-black tracking-tight leading-tight">
              {form.package_name || "Nama Program Paket"}
            </h3>
            <p className="opacity-75 text-xs font-bold mt-1 uppercase tracking-wider">
              {form.education_level || "JENJANG SEKOLAH"}
            </p>
          </div>
          <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
            {form.is_active ? "Aktif" : "Draft"}
          </span>
        </div>

        <div className="mt-6 text-3xl font-black font-mono tracking-tight relative z-10">
          Rp {Number(form.default_price || 0).toLocaleString("id-ID")}
        </div>

        <div className="mt-5 space-y-2 text-sm font-bold relative z-10">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span>📚</span> {form.meeting_per_month || 0}x Pertemuan / Bulan
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span>⏰</span> {form.duration_minutes || 0} Menit per Sesi
          </div>
          
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-md text-[10px] font-bold border border-white/5">
              {PACKAGE_CLASS_TYPES[form.class_type]?.label || form.class_type}
            </span>
          </div>
        </div>

        <div className="mt-4 text-xs opacity-80 font-medium line-clamp-3 leading-relaxed border-t border-white/10 pt-3 relative z-10">
          {form.description || "Deskripsi cakupan silabus atau bonus paket promosi akan muncul secara real-time di sini."}
        </div>
      </div>

      <button 
        type="button" 
        disabled
        className="mt-6 w-full bg-white text-gray-950 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm opacity-95 relative z-10 select-none border border-transparent"
      >
        Daftar Sekarang via App
      </button>
    </div>
  );
}