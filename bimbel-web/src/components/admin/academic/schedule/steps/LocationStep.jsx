import React from "react";
import { Building2, Home, Globe, Layers } from "lucide-react";

export default function LocationStep({
  currentClassType,
  formData,
  setFormData,
  locationList,
  selectedClassObj,
  subjectName,
  tentorName,
}) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      {/* REGULER -> Gedung + Ruang */}
      {currentClassType === "REGULER" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
            <Building2 size={14} className="text-blue-500" /> 5. Pilih Gedung Lokasi Bimbel & Ruangan
          </label>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Pilih Gedung / Lokasi
            </label>
            <select
              required
              value={formData.location_id}
              onChange={(e) =>
                setFormData({ ...formData, location_id: e.target.value })
              }
              className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-900 bg-white focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="">-- Pilih Lokasi Bimbel --</option>
              {locationList.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code ? `[${loc.code}] ` : ""}
                  {loc.location_name} - {loc.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Nama Ruangan
            </label>
            <input
              type="text"
              required
              value={formData.room_name}
              onChange={(e) =>
                setFormData({ ...formData, room_name: e.target.value })
              }
              className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-900 bg-white focus:border-blue-500 shadow-2xs"
              placeholder="Contoh: Ruang A-01 / Lab Komputer"
            />
          </div>
        </div>
      )}

      {/* PRIVATE -> Konfirmasi saja */}
      {currentClassType === "PRIVATE" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
            <Home size={14} className="text-emerald-500" /> 5. Konfirmasi Sesi Kelas Private
          </label>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
            <p className="font-bold">Kelas Private (Kunjungan Rumah)</p>
            <p>
              Koordinat lokasi dan alamat akan otomatis merujuk ke data domisili peserta didik.
            </p>
          </div>
        </div>
      )}

      {/* ONLINE -> Link Meeting */}
      {currentClassType === "ONLINE" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
            <Globe size={14} className="text-purple-500" /> 5. Masukkan Link Meeting Daring
          </label>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              URL Meeting (Zoom / Google Meet)
            </label>
            <input
              type="url"
              required
              value={formData.meeting_url}
              onChange={(e) =>
                setFormData({ ...formData, meeting_url: e.target.value })
              }
              className="w-full mt-1 rounded-xl border border-gray-200 p-3 text-xs font-bold text-gray-900 bg-white focus:border-purple-500 shadow-2xs"
              placeholder="https://zoom.us/j/..."
            />
          </div>
        </div>
      )}

      {/* Final Review Box */}
      <div className="bg-slate-900 p-4 rounded-2xl shadow-inner space-y-2 mt-4 text-xs relative overflow-hidden text-slate-300">
        <div className="absolute -right-4 -top-4 opacity-5">
          <Layers size={100} />
        </div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2 border-b border-slate-700 pb-2">
          Final Review
        </p>
        <p>
          Kelas:{" "}
          <span className="font-bold text-white">
            {selectedClassObj?.name} ({currentClassType})
          </span>
        </p>
        <p>
          Mapel: <span className="font-bold text-white">{subjectName}</span>
        </p>
        <p>
          Waktu:{" "}
          <span className="font-bold text-amber-400">
            {formData.day_of_week} ({formData.start_time} - {formData.end_time})
          </span>
        </p>
        <p>
          Tentor: <span className="font-bold text-emerald-400">{tentorName}</span>
        </p>
        {currentClassType === "REGULER" && (
          <p>
            Lokasi:{" "}
            <span className="font-bold text-blue-400">
              {locationList.find((l) => String(l.id) === String(formData.location_id))
                ?.location_name || "-"}{" "}
              ({formData.room_name})
            </span>
          </p>
        )}
      </div>
    </div>
  );
}