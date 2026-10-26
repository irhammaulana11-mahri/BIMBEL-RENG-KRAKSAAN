import React from "react";
import { MapPin, Globe, Home, CalendarDays, Info } from "lucide-react";

export default function StepLocation({ formData, setFormData, locationList = [] }) {
  const classType = formData.class_type?.toUpperCase() || "REGULER";

  return (
    <div className="space-y-5 animate-in slide-in-from-right-4">
      {/* 1. TANGGAL MULAI KBM (WAJIB UNTUK GENERATOR) */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
        <h4 className="flex items-center gap-2 text-sm font-black text-blue-900 mb-3">
          <CalendarDays size={18} /> Tanggal Efektif Mulai KBM
        </h4>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-1/2">
            <label className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Tanggal Mulai (Start Date)</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full border border-blue-200 rounded-xl p-2.5 text-sm font-bold font-mono bg-white focus:border-blue-500 shadow-sm"
            />
          </div>
          <p className="text-xs text-blue-700 font-medium leading-relaxed w-full md:w-1/2">
            Tanggal ini digunakan sebagai <strong className="font-bold">titik awal perhitungan</strong> oleh sistem untuk men-generate seluruh sesi pertemuan ke depan berdasarkan pola hari yang telah Anda buat di Step 2.
          </p>
        </div>
      </div>

      {/* 2. PENGATURAN LOKASI DINAMIS BERDASARKAN TIPE KELAS */}
      <div className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
        <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
          {classType === "REGULER" && <><MapPin size={16} className="text-blue-600"/> Lokasi Offline (Cabang)</>}
          {classType === "ONLINE" && <><Globe size={16} className="text-purple-600"/> Link Meeting Online</>}
          {classType === "PRIVATE" && <><Home size={16} className="text-emerald-600"/> Lokasi Private (Rumah Siswa)</>}
        </h4>

        {/* --- FORM LOKASI REGULER --- */}
        {classType === "REGULER" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Pilih Cabang Gedung</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold bg-gray-50 focus:bg-white"
              >
                <option value="">-- Pilih Lokasi Cabang --</option>
                {locationList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ruangan / Kelas</label>
              <input
                type="text"
                placeholder="Misal: Ruang A-01"
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold bg-gray-50 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* --- FORM LOKASI ONLINE --- */}
        {classType === "ONLINE" && (
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Meeting URL (Zoom / G-Meet)</label>
            <input
              type="url"
              placeholder="https://zoom.us/j/123456..."
              value={formData.meeting_url}
              onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-medium text-blue-600 bg-gray-50 focus:bg-white"
            />
            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
              <Info size={12}/> Link ini akan dibagikan ke siswa melalui Dashboard dan WhatsApp.
            </p>
          </div>
        )}

        {/* --- FORM LOKASI PRIVATE --- */}
        {classType === "PRIVATE" && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p className="font-medium">
              Untuk kelas tipe <strong>Private</strong>, sistem akan secara otomatis menggunakan alamat/koordinat yang terdaftar pada profil Siswa/Orang Tua. Anda tidak perlu mengatur ruangan spesifik di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}