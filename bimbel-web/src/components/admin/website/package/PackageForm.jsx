import React from "react";
import PackagePreview from "./PackagePreview";
import { PACKAGE_CLASS_TYPES } from "./packageTypes";

export default function PackageForm({ form, setForm }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Kolom Kiri: Input Teknis Master Data (Col Span 7) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nama Paket Bimbingan</label>
            <input required name="package_name" value={form.package_name} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: SD Reguler Super"/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Target Jenjang Sekolah</label>
            <select name="education_level" required value={form.education_level} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none">
              <option value="">Pilih Jenjang</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SNBT">SNBT / Alumni</option>
              <option value="Kedinasan">Kedinasan</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Biaya Bulanan (IDR)</label>
          <input type="number" min={0} required name="default_price" value={form.default_price} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500" placeholder="Contoh: 250000"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Total Pertemuan / Bulan</label>
            <input type="number" required name="meeting_per_month" value={form.meeting_per_month} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: 8"/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Durasi Belajar per Sesi (Menit)</label>
            <input type="number" required name="duration_minutes" value={form.duration_minutes} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: 90"/>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tipe Kelas</label>
          <select name="class_type" required value={form.class_type} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none">
            {Object.entries(PACKAGE_CLASS_TYPES).map(([value, t]) => <option key={value} value={value}>{t.label}</option>)}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">Menentukan kelas yang memakai paket ini dan cara absensi (gedung / online / rumah siswa).</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Deskripsi / Silabus Ketentuan Program</label>
          <textarea rows="3" name="description" value={form.description} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500" placeholder="Jelaskan detail fasilitas pendukung paket..."/>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
          Paket aktif (tampil di website & bisa dipilih saat membuat kelas)
        </label>
      </div>

      {/* Kolom Kanan: Sticky Preview Area (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Live Mobile View Preview</span>
        <div className="sticky top-2">
          <PackagePreview form={form} />
        </div>
      </div>

    </div>
  );
}