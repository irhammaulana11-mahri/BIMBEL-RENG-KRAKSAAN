import React, { useState, useEffect } from "react";
import { Lock, Save, Calendar as CalendarIcon } from "lucide-react";

/**
 * Custom Input Date Picker agar Tampilan & Format tanggal (DD/MM/YYYY)
 * rapi, modern, dan konsisten di semua browser/OS.
 */
function DatePickerInput({ label, value, onChange, placeholder = "DD/MM/YYYY" }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="date"
          value={value || ""}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-200 pl-3.5 pr-10 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-colors shadow-2xs"
          placeholder={placeholder}
        />
        <CalendarIcon
          size={15}
          className="absolute right-3 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

export default function TentorEditForm({ tentor, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nik: "",
    gender: "L",
    birth_date: "",
    joining_date: "",
    education: "",
    specialization: "SAINTEK",
    address: "",
    is_active: true,
  });

  // Helper format tanggal dari YYYY-MM-DD THH:mm ke YYYY-MM-DD
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return dateString.slice(0, 10);
  };

  // Sinkronkan data tentor ke state form
  useEffect(() => {
    if (tentor) {
      setFormData({
        name: tentor.name || tentor.user?.name || "",
        email: tentor.user?.email || tentor.email || "",
        phone: tentor.phone || tentor.user?.phone || "",
        nik: tentor.nik || "",
        gender: tentor.gender || "L",
        birth_date: formatDateForInput(tentor.birth_date),
        joining_date: formatDateForInput(tentor.joining_date),
        education: tentor.education || "",
        specialization: tentor.specialization || "SAINTEK",
        address: tentor.address || "",
        is_active: tentor.user?.is_active ?? tentor.is_active ?? true,
      });
    }
  }, [tentor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Nama Lengkap */}
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
            Nama Lengkap Tentor *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="Masukkan nama lengkap..."
          />
        </div>

        {/* Email Read-Only */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
            Email <Lock size={10} />
          </label>
          <input
            type="email"
            readOnly
            value={formData.email}
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">
            No. WhatsApp *
          </label>
          <input
            type="text"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="081234567890"
          />
        </div>

        {/* NIK */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">NIK</label>
          <input
            type="text"
            value={formData.nik}
            onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono font-bold bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="3512..."
          />
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Jenis Kelamin</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="L">Laki-Laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        {/* 🟢 TANGGAL LAHIR (MENGGUNAKAN KOMPONEN DATEPICKER) */}
        <DatePickerInput
          label="Tanggal Lahir"
          value={formData.birth_date}
          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
        />

        {/* 🟢 TANGGAL BERGABUNG (MENGGUNAKAN KOMPONEN DATEPICKER) */}
        <DatePickerInput
          label="Tgl Bergabung"
          value={formData.joining_date}
          onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
        />

        {/* Pendidikan */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Pendidikan</label>
          <input
            type="text"
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="Contoh: S1 Pendidikan"
          />
        </div>

        {/* Spesialisasi */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Kluster Spesialisasi</label>
          <select
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="SAINTEK">Saintek (IPA/MTK/Sains)</option>
            <option value="SOSHUM">Soshum (IPS/Sosial)</option>
            <option value="BAHASA">Bahasa & Literasi</option>
            <option value="UMUM">Umum / Semua Jenjang</option>
          </select>
        </div>

        {/* Alamat */}
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Alamat Domisili</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            placeholder="Alamat lengkap domisili..."
          />
        </div>

        {/* Status Keaktifan */}
        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Status Keaktifan</label>
          <select
            value={formData.is_active ? "true" : "false"}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold bg-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="true">Aktif (Dapat di-plotting jadwal & mapel)</option>
            <option value="false">Nonaktif (Akses mengajar terkunci)</option>
          </select>
        </div>
      </div>

      {/* Tombol Aksi Form */}
      <div className="pt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save size={14} /> {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}