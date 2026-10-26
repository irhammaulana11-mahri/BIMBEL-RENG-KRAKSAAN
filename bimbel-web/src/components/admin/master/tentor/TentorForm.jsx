import React from "react";
import { User, ShieldCheck } from "lucide-react";
import SelectedSubjectCards from "./SelectedSubjectCards";

export default function TentorForm({ formData, setFormData, onRemoveSubject, onOpenSubjectModal }) {
  return (
    <div className="space-y-6">
      
      {/* SEKSI 1: DATA AKUN LOGIN */}
      <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
          <ShieldCheck className="text-blue-600" size={18} />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">1. Data Akses Akun Login</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap Tentor</label>
            <input
              type="text" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Fitriyah Dewi, S.Pd."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Email (Username Login)</label>
            <input
              type="email" required value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="fitriyah@gmail.com"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">No. WhatsApp / HP</label>
            <input
              type="text" required value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="081234567890"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Password Default</label>
            <input
              type="password" required value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      {/* SEKSI 2: BIODATA TENTOR */}
      <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
          <User className="text-blue-600" size={18} />
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">2. Biodata & Kualifikasi Tentor</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">NIK</label>
            <input
              type="text" value={formData.nik}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="351301..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Lahir</label>
            <input
              type="date" value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Jenis Kelamin</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="L">Laki-Laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Pendidikan Terakhir</label>
            <input
              type="text" value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="S1 Bahasa Inggris"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kluster Spesialisasi</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="SAINTEK">Saintek (IPA/MTK/Sains)</option>
              <option value="SOSHUM">Soshum (IPS/Sosial)</option>
              <option value="BAHASA">Bahasa & Literasi</option>
              <option value="UMUM">Umum / Semua Jenjang</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Keaktifan</label>
            <select
              value={formData.is_active ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="true">Aktif (Dapat di-plotting)</option>
              <option value="false">Nonaktif (Terikat arsip)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alamat Domisili</label>
            <input
              type="text" value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
              placeholder="Jl. Merdeka No. 45, Kraksaan"
            />
          </div>
        </div>
      </div>

      {/* SEKSI 3: KOMPETENSI MENGAJAR */}
      <SelectedSubjectCards
        selectedSubjects={formData.selectedSubjects}
        onRemove={onRemoveSubject}
        onOpenModal={onOpenSubjectModal}
      />

    </div>
  );
}