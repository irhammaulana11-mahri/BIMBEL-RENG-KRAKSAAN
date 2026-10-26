import React from "react";

export default function StepPackage({ 
  formData, 
  setFormData, 
  packages = [], 
  locations = [], 
  educationLevels = [] 
}) {
  
  // StepPackage.jsx
  const handlePackageChange = (packageId) => {
    const pkg = packages.find((p) => String(p.id) === String(packageId));
    if (pkg) {
      // Normalisasi class_type ke UPPERCASE
      let rawType = (pkg.class_type || "REGULER").toUpperCase();
      if (rawType === "BIMBEL" || rawType === "RUMAH") {
        rawType = rawType === "RUMAH" ? "PRIVATE" : "REGULER";
      }

      setFormData((prev) => ({
        ...prev,
        package_id: pkg.id,
        class_type: rawType,
        education_level: pkg.education_level || prev.education_level,
        meeting_per_month: pkg.meeting_per_month,
        duration_minutes: pkg.duration_minutes ,
        // Reset lokasi jika tipe ONLINE / PRIVATE
        learning_location_id: (rawType === "ONLINE" || rawType === "PRIVATE") ? "" : prev.learning_location_id,
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        package_id: "", 
        class_type: "REGULER" 
      }));
    }
  };

  // Filter pilihan grade/tingkat kelas sesuai education_level dari package yang dipilih
  const filteredGradeLevels = educationLevels.filter((el) => {
    if (!formData.education_level) return true;
    return String(el.education_level).toUpperCase() === String(formData.education_level).toUpperCase();
  });

  const isLocationRequired = formData.class_type === "REGULER" || formData.class_type === "bimbel";

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      
      {/* 1. PILIH PAKET BELAJAR */}
      <div>
        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
          Pilih Paket Belajar *
        </label>
        <select
          required
          value={formData.package_id || ""}
          onChange={(e) => handlePackageChange(e.target.value)}
          className="w-full mt-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
        >
          <option value="">-- Pilih Package --</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.package_name} ({p.education_level} - {p.class_type})
            </option>
          ))}
        </select>
      </div>

      {/* 2. KODE KELAS & NAMA KELAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Kode Kelas *
          </label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-blue-600 bg-white focus:outline-none focus:border-blue-500"
            placeholder="CLS-SD-01"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Nama Rombel / Kelas *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: REG SD 1A Unggulan"
            className="w-full mt-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 3. JENIS KELAS, JENJANG & GRADE LEVEL (TINGKAT KELAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Jenis Kelas
          </label>
          <input
            type="text"
            readOnly
            value={formData.class_type || "-"}
            className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Jenjang Utama
          </label>
          <input
            type="text"
            readOnly
            value={formData.education_level || "-"}
            className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* 🟢 DROPDOWN GRADE / LEVEL EDUCATION (misal: Kelas 1, Kelas 2, Kelas 7, dst) */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Tingkat Kelas (Grade) *
          </label>
          <select
            required
            value={formData.education_level_id || ""}
            onChange={(e) => setFormData({ ...formData, education_level_id: e.target.value })}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-white cursor-pointer focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="">-- Pilih Tingkat Kelas --</option>
            {filteredGradeLevels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.display_name || lvl.education_level || `Kelas ${lvl.grade_level}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. TOTAL SESI & DURASI */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Total Sesi / Bulan
          </label>
          <input
            type="text"
            readOnly
            value={formData.meeting_per_month ? `${formData.meeting_per_month} Sesi` : "-"}
            className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Durasi Belajar
          </label>
          <input
            type="text"
            readOnly
            value={formData.duration_minutes ? `${formData.duration_minutes} Menit` : "-"}
            className="w-full mt-1 border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      {/* 5. LOKASI BELAJAR (KONDISIONAL) & KAPASITAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* 🟢 KONDISIONAL LOKASI BELAJAR: Hanya aktif jika REGULER */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
            <span>Gedung / Cabang Lokasi</span>
            {!isLocationRequired && (
              <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Tidak Diperlukan ({formData.class_type || "ONLINE/PRIVATE"})
              </span>
            )}
          </label>
          
          <select
            disabled={!isLocationRequired}
            value={formData.learning_location_id || ""}
            onChange={(e) => setFormData({ ...formData, learning_location_id: e.target.value })}
            className={`w-full mt-1 border rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              isLocationRequired 
                ? "border-gray-200 bg-white cursor-pointer focus:border-blue-500" 
                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <option value="">
              {isLocationRequired ? "-- Pilih Cabang Bimbel --" : "Lokasi Fleksibel (Online / Rumah Siswa)"}
            </option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.location_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            Kapasitas Maksimal Siswa *
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_students || 10}
            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 1 })}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

    </div>
  );
}