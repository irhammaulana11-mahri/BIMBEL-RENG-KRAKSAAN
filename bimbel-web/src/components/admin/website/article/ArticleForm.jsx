import React from "react";
import DatePicker from "react-datepicker";
import { UploadCloud } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import CategorySelector from "./CategorySelector";
import ArticlePreview from "./ArticlePreview";

export default function ArticleForm({ form, setForm, preview, handleImage }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Kolom Kiri: Input Form Master (Col Span 7) */}
      <div className="lg:col-span-7 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Judul Kelompok Artikel</label>
          <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: 5 Tips Ampuh Tembus Pilihan Utama SNBT Kategori Saintek"/>
        </div>
        
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ringkasan Pendek (Summary)</label>
          <textarea rows={2} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500" placeholder="Tulis lead ringkasan artikel untuk grid preview utama..."/>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Konten Naskah Lengkap</label>
          <textarea rows={8} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed font-sans focus:outline-none focus:border-blue-500" placeholder="Ketik isi pembahasan artikel secara mendetail di sini..."/>
        </div>

        {/* Klasifikasi Kategori Multi-Tags */}
        <div className="p-4 bg-slate-50/50 border border-gray-150 rounded-2xl">
          <CategorySelector value={form.categories} onChange={(categories) => setForm({ ...form, categories })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Tanggal Publikasi</label>
            <div className="mt-1.5 relative custom-datepicker-wrapper">
              <DatePicker selected={form.publish_date ? new Date(form.publish_date) : null} onChange={(date) => setForm({ ...form, publish_date: date })} dateFormat="dd/MM/yyyy" placeholderText="Pilih Tanggal Rilis" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Featured Thumbnail Image</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-3 text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer relative group">
              <input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <UploadCloud className="w-5 h-5 text-gray-400 mx-auto mb-1 group-hover:text-blue-500 transition-colors" />
              <p className="text-xs font-bold text-gray-700">{preview ? "Ubah gambar pilihan" : "Klik untuk pilih foto utama"}</p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Publikasikan Artikel (Terbit Langsung Secara Live)
          </label>
        </div>
      </div>

      {/* Kolom Kanan: Sticky Preview Area (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Live Desktop & Mobile Preview</span>
        <div className="sticky top-2">
          <ArticlePreview form={{ ...form, featured_image: preview || form.featured_image }} />
        </div>
      </div>

    </div>
  );
}