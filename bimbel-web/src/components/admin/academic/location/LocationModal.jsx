import React, { useEffect, useState } from "react";
import { X, MapPin, Navigation, Save } from "lucide-react";

export default function LocationModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    code: "",
    location_name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius_meter: "100",
    description: "",
    is_active: true,
  });

  const [gettingGPS, setGettingGPS] = useState(false);
  const [gpsError, setGpsError] = useState("");

  useEffect(() => {
    if (open) {
      if (data) {
        setFormData({
          code: data.code || "",
          location_name: data.location_name || "",
          address: data.address || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          radius_meter: data.radius_meter || "100",
          description: data.description || "",
          is_active: data.is_active ?? true,
        });
      } else {
        setFormData({
          code: `LOC${Math.floor(100 + Math.random() * 900)}`,
          location_name: "",
          address: "",
          latitude: "",
          longitude: "",
          radius_meter: "100",
          description: "",
          is_active: true,
        });
      }
    }
  }, [data, open]);

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung geolokasi GPS.");
      return;
    }
    setGpsError("");
    setGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setGettingGPS(false);
      },
      (error) => {
        console.error("Gagal mendapatkan GPS:", error);
        setGpsError("Gagal mengambil titik GPS. Pastikan izin lokasi diaktifkan.");
        setGettingGPS(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <button 
          onClick={onClose} 
          type="button"
          className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">
              {data ? "Koreksi Data Lokasi" : "Tambah Lokasi Bimbel Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Atur titik koordinat pusat gedung dan radius absensi fisik.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto pr-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kode Lokasi</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-blue-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="LOC001"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Lokasi Bimbel</label>
              <input
                type="text"
                required
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Contoh: Gedung Kraksaan Pusat"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alamat Lengkap</label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Jl. Raya Kraksaan No. 12..."
            />
          </div>

          {/* Koordinat & GPS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Titik Koordinat GPS</span>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={gettingGPS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-2xs transition-all cursor-pointer disabled:bg-blue-300"
              >
                <Navigation size={13} className={gettingGPS ? "animate-spin" : ""} />
                {gettingGPS ? "Mendeteksi..." : "📍 Gunakan Lokasi Saat Ini"}
              </button>
            </div>
            {gpsError && <p className="text-xs font-medium text-red-600">{gpsError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-7.782912"
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs font-mono text-gray-800 bg-white focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="113.412154"
                  className="w-full mt-1 rounded-xl border border-gray-200 p-2.5 text-xs font-mono text-gray-800 bg-white focus:border-blue-500"
                />
              </div>
            </div>

            {/* Live Map Preview Mock */}
            <div className="w-full h-24 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-blue-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:12px_12px]" />
              <MapPin size={22} className="text-blue-600 animate-bounce" />
              <p className="text-[11px] font-bold mt-1">{formData.location_name || "Pratinjau Lokasi Bimbel"}</p>
              <span className="text-[9px] font-mono text-gray-500">
                {formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : "Belum ada koordinat terplot"}
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Radius Absensi (Meter)</label>
            <input
              type="number"
              required
              value={formData.radius_meter}
              onChange={(e) => setFormData({ ...formData, radius_meter: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, radius_meter: "50" })}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${formData.radius_meter === "50" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                50 m (Ruang Kecil)
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, radius_meter: "100" })}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${formData.radius_meter === "100" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                100 m (Kantor)
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, radius_meter: "150" })}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${formData.radius_meter === "150" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
              >
                150 m (Gedung Besar)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Deskripsi / Catatan</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Patokan bangunan..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Keaktifan</label>
            <select
              value={formData.is_active ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="true">Aktif (Dapat dipilih dalam jadwal)</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Save size={15} />
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}