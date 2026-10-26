import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export default function CurriculumFormView({ subject, initialData, onBack, onSubmit, loading }) {
  const [form, setForm] = useState({
    subject_id: subject?.id || "",
    education_level_id: subject?.education_level_id || "",
    semester: 1,
    order_no: 1,
    title: "",
    description: "",
    is_active: true,
  });

  // 🟢 Sinkronisasi State secara reaktif saat `initialData` (Edit Mode) dikirim dari Parent
  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id, // Sertakan ID unik untuk rute PUT/PATCH
        subject_id: initialData.subject_id || subject?.id || "",
        education_level_id: initialData.education_level_id || subject?.education_level_id || "",
        semester: Number(initialData.semester ?? 1),
        order_no: Number(initialData.order_no ?? 1),
        title: initialData.title || "",
        description: initialData.description || "",
        is_active: Boolean(initialData.is_active ?? true),
      });
    } else {
      setForm({
        subject_id: subject?.id || "",
        education_level_id: subject?.education_level_id || "",
        semester: 1,
        order_no: 1,
        title: "",
        description: "",
        is_active: true,
      });
    }
  }, [initialData, subject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert("Judul topik harus diisi!");
      return;
    }

    // 🟢 Eksekusi Callback Submit dengan Data Terbaru
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-black text-gray-950">
            {initialData ? "Edit Topik Kurikulum" : "Tambah Curriculum Baru"}
          </h3>
          <p className="text-[11px] text-gray-400">{subject?.name} • {subject?.education_level_name || subject?.education_level?.display_name || "-"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Semester *</label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) || 1 })}
            className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
            <option value={3}>Semester 3</option>
            <option value={4}>Semester 4</option>
            <option value={5}>Semester 5</option>
            <option value={6}>Semester 6</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Urutan (Order) *</label>
          <input
            type="number"
            required
            min={1}
            value={form.order_no}
            onChange={(e) => setForm({ ...form, order_no: parseInt(e.target.value) || 1 })}
            className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
            placeholder="Contoh: 1"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Judul Topik *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
          placeholder="Contoh: Bilangan Bulat & Pecahan"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Deskripsi Bab</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-medium resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
          placeholder="Penjelasan ringkas mengenai kompetensi bab ini..."
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Kurikulum</label>
        <select
          value={form.is_active ? "true" : "false"}
          onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
          className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="true">Aktif (Topik Dapat Digunakan)</option>
          <option value="false">Non-aktif (Topik Tidak Dapat Digunakan)</option>
        </select>
      </div>

      <div className="pt-3 border-t border-gray-100 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Batal
        </button>
        {/* 🟢 Tombol Submit Diberikan type="submit" Eksplisit */}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          {loading ? "Menyimpan..." : initialData ? "Perbarui Topik" : "Simpan Topik"}
        </button>
      </div>
    </form>
  );
}