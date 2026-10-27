import React, { useEffect, useState } from "react";
import { X, Layers, MapPin, Sparkles } from "lucide-react";

export default function ClassModal({ open, onClose, data, onSubmit, loading }) {
  const [gpsError, setGpsError] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    class_type: "REGULER", // Disesuaikan dengan class_type di database
    education_level: "SD", // Disesuaikan dengan education_level di database
    location_name: "",
    latitude: "",
    longitude: "",
    radius_meter: 50,
    max_students: 10, // Disesuaikan dengan max_students di database
    is_active: true, // Disesuaikan dengan is_active di database
    description: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        code: data.code || "",
        name: data.name || data.class_name || "",
        class_type: data.class_type || data.location_type || "REGULER",
        education_level: data.education_level || data.level || "SD",
        location_name: data.location_name || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        radius_meter: data.radius_meter || 50,
        max_students: data.max_students || data.max_capacity || 10,
        is_active: data.is_active ?? true,
        description: data.description || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        class_type: "REGULER",
        education_level: "SD",
        location_name: "",
        latitude: "",
        longitude: "",
        radius_meter: 50,
        max_students: 10,
        is_active: true,
        description: "",
      });
    }
  }, [data, open]);

  const handleGetCurrentLocation = () => {
    setGpsError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        () => {
          setGpsError("Gagal menarik koordinat GPS. Pastikan izin akses lokasi browser diizinkan.");
        }
      );
    } else {
      setGpsError("Browser Anda tidak mendukung geolokasi.");
    }
  };

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-6 flex items-start gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">
              {data ? "Koreksi Profil Class" : "Create Class"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Konfigurasi parameter kelas, lokasi KBM, dan batasan kuota siswa.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SECTION: INFORMASI UMUM */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Sparkles size={15} className="text-blue-600" />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Informasi Umum
              </h3>
            </div>

            {/* 1. KODE & NAMA CLASS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Kode Class
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                  placeholder="CLS-SD-01"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Nama Class
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: 12 IPA Unggulan"
                />
              </div>
            </div>

            {/* 2. JENIS CLASS & JENJANG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Jenis Class
                </label>
                <select
                  required
                  value={formData.class_type}
                  onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="reguler">Reguler (Gedung Bimbel)</option>
                  <option value="private">Private (Datang ke Rumah)</option>
                  <option value="online">Online (Daring / Zoom)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Jenjang Pendidikan
                </label>
                <select
                  required
                  value={formData.education_level}
                  onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="TK">TK</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
            </div>

            {/* 3. KAPASITAS & STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Kapasitas Maksimal (Siswa)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Status Class
                </label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="true">Aktif (KBM Berjalan)</option>
                  <option value="false">Non-aktif (Terarsip)</option>
                </select>
              </div>
            </div>

            {/* 4. PEMETAAN LOKASI GEOTAG (Jika bukan ONLINE) */}
            {/* {formData.class_type !== "ONLINE" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Lokasi / Geotag Absensi ({formData.class_type === "REGULER" ? "Gedung Bimbel" : "Rumah Privat"})
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Tangkap GPS
                  </button>
                </div>
                {gpsError && <p className="text-xs font-medium text-red-600">{gpsError}</p>}

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Detail Nama Ruangan / Deskripsi Alamat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                    placeholder={
                      formData.class_type === "REGULER"
                        ? "Contoh: Ruang Kelas 204 Gedung Pusat"
                        : "Masukkan alamat rumah privat siswa"
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Latitude</label>
                    <input
                      type="text"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                      placeholder="-7.8123"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Longitude</label>
                    <input
                      type="text"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                      placeholder="113.4123"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Radius (m)</label>
                    <input
                      type="number"
                      required
                      value={formData.radius_meter}
                      onChange={(e) => setFormData({ ...formData, radius_meter: parseInt(e.target.value) || 50 })}
                      className="w-full mt-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>
            )} */}

            {/* 5. DESKRIPSI */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-900 h-20 resize-none focus:outline-none focus:border-blue-500"
                placeholder="Deskripsi singkat mengenai target belajar atau kesepakatan KBM kelas ini..."
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {loading ? "Menyimpan Data..." : "Simpan Class"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}