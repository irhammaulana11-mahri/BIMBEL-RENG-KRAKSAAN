import React from "react";
import PackagePreview from "./PackagePreview";

export default function PackageForm({ form, setForm }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Kumpulan palet warna premium untuk kustomisasi kartu visual
  const colorPresets = [
    { name: "Sapphire Blue", value: "#2563eb" },
    { name: "Emerald Green", value: "#059669" },
    { name: "Luxury Purple", value: "#7c3aed" },
    { name: "Sunset Orange", value: "#ea580c" },
    { name: "Ruby Red", value: "#dc2626" },
  ];

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
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Skema Biaya Paket (Nominal IDR)</label>
          <input type="number" required name="price" value={form.price} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500" placeholder="Contoh: 250000"/>
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

        {/* Kustomisasi Warna Kartu menggunakan Presets modern */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Tema Warna Kartu Tampilan</label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, card_color: color.value }))}
                className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 ${form.card_color === color.value ? "scale-110 border-gray-950 shadow-xs" : "border-transparent hover:scale-105"}`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            <input 
              type="color" 
              name="card_color" 
              value={form.card_color || "#2563eb"} 
              onChange={handleChange} 
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
              title="Kustom Warna Bebas"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Deskripsi / Silabus Ketentuan Program</label>
          <textarea rows="3" name="description" value={form.description} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500" placeholder="Jelaskan detail fasilitas pendukung paket..."/>
        </div>

        {/* Parameter Boolean Tipe Akses Absensi Geotag */}
        <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl space-y-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block border-b pb-1">Opsi Metode & Status Publikasi</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="is_home_visit" checked={form.is_home_visit} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              Home Visit
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="is_building_class" checked={form.is_building_class} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              Building Class
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              Status Aktif
            </label>
          </div>
        </div>
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