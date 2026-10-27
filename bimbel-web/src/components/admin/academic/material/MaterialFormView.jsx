import React, { useState, useEffect } from "react";
import { ArrowLeft, Upload, Link, Video, FileText } from "lucide-react";
import { MATERIAL_TYPES } from "../../../../components/constants/material.constants";
import FileDropzone from "../../../../components/ui/FileDropzone";


export default function MaterialFormView({ curriculum, materialType, initialData, onBack, onSubmit, loading }) {
  const activeType = initialData?.material_type || materialType || "DOCUMENT";
  const typeConfig = MATERIAL_TYPES[activeType] || MATERIAL_TYPES.DOCUMENT;

  const [form, setForm] = useState({
    curriculum_id: curriculum.id,
    material_type: materialType,
    title: initialData?.title || "",
    description: initialData?.description || "",
    file_path: initialData?.file_path || "",
    video_url: initialData?.video_url || "",
    external_url: initialData?.external_url || "",
    duration_minutes: initialData?.duration_minutes || 15,
    sort_order: initialData?.sort_order || 1,
    is_active: initialData?.is_active ?? true,
  });


  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id,
        curriculum_id: initialData.curriculum_id || curriculum.id,
        material_type: initialData.material_type || activeType,
        title: initialData.title || "",
        description: initialData.description || "",
        file_path: initialData.file_path || "",
        video_url: initialData.video_url || "",
        external_url: initialData.external_url || "",
        duration_minutes: Number(initialData.duration_minutes ?? 15),
        sort_order: Number(initialData.sort_order ?? 1),
        is_active: Boolean(initialData.is_active ?? true),
      });
    } else {
      setForm({
        curriculum_id: curriculum.id,
        material_type: activeType,
        title: "",
        description: "",
        file_path: "",
        video_url: "",
        external_url: "",
        duration_minutes: 15,
        sort_order: 1,
        is_active: true,
      });
    }
  }, [initialData, curriculum, activeType]);


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
      {/* Header Inline Form */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-black text-gray-950">{curriculum.title}</h3>
          <p className="text-[13px] text-gray-400 font-bold">
            {initialData ? `Edit Material (${typeConfig.label})` : `Tambah ${typeConfig.label}`}
          </p>
        </div>
      </div>

      {/* 1. Judul Material */}
      <div>
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Judul Material *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
          placeholder="Contoh: Modul Rumus Dasar Persamaan"
        />
      </div>

      {/* 2. UPLOAD FILE ADAPTIF / INPUT LINK */}
      {(activeType === "DOCUMENT" || activeType === "PRESENTATION" || activeType === "IMAGE") && (
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 block">
            Upload File Dokumen *
          </label>
          <FileDropzone
            value={form.file_path}
            onChange={(url) => setForm({ ...form, file_path: url })}
            accept={
              activeType === "IMAGE"
                ? ".png,.jpg,.jpeg,.webp"
                : activeType === "PRESENTATION"
                ? ".ppt,.pptx,.pdf"
                : ".pdf,.doc,.docx,.ppt,.pptx"
            }
          />
        </div>
      )}

      {activeType === "VIDEO" && (
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">URL Video (YouTube / Vimeo) *</label>
          <div className="relative mt-1">
            <input
              type="url"
              required
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Video size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {activeType === "LINK" && (
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tautan Web External *</label>
          <div className="relative mt-1">
            <input
              type="url"
              required
              value={form.external_url}
              onChange={(e) => setForm({ ...form, external_url: e.target.value })}
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
              placeholder="https://pembahasan-soal.com/persamaan"
            />
            <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {/* 3. Estimasi & Urutan */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Estimasi Belajar (Mnt)</label>
          <input
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
            className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Urutan Tampil (Sort Order)</label>
          <input
            type="number"
            min={1}
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 1 })}
            className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. Deskripsi Singkat */}
      <div>
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Deskripsi Singkat</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-medium resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
          placeholder="Ringkasan atau poin penting materi ini..."
        />
      </div>

      {/* Tombol Aksi */}
      <div className="pt-3 border-t border-gray-100 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {loading ? "Menyimpan..." : initialData ? "Perbarui Material" : "Simpan Resource"}
        </button>
      </div>
    </form>
  );
}