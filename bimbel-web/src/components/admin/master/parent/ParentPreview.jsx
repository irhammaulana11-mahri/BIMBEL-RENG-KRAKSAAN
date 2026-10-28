import React from "react";
import { mapsLink } from "@/utils/geo";
import { X, Mail, Phone, Briefcase, Users, MapPin, Plus, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ParentPreview({ parent, onClose }) {
  const navigate = useNavigate();
  if (!parent) return null;

  const childrenCount = parent.students_count || parent.students?.length || 0;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity animate-fade-in" />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-gray-100">
        
        {/* Header Drawer */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
          
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold uppercase tracking-wider">
            Parent Profile Sheet
          </span>
          {/* Nama diubah ke text-2xl font-black */}
          <h2 className="text-2xl font-black text-gray-950 mt-1.5">{parent.parent_name || parent.full_name}</h2>
          
          <div className="flex gap-2 mt-2">
            <span className="px-3 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">Aktif</span>
            <span className="px-3 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {childrenCount} Anak Terdaftar
            </span>
          </div>
        </div>

        {/* Detail Konten Informasi */}
        <div className="p-6 space-y-6 flex-1">
          <InfoRow icon={<Mail size={18} />} label="Alamat Email User" value={parent.email || parent.user?.email || "-"} />
          <InfoRow icon={<Phone size={18} />} label="Nomor WhatsApp Wali" value={parent.phone || parent.user?.phone || "-"} />
          <InfoRow icon={<Briefcase size={18} />} label="Mata Pencaharian / Pekerjaan" value={parent.occupation || "-"} />
          <InfoRow icon={<Users size={18} />} label="Hubungan Keluarga" value={parent.relationship || "Orang Tua Kandung"} />
          <InfoRow icon={<MapPin size={18} />} label="Alamat Domisili Rumah" value={parent.address || "-"} />
          {parent.latitude != null && (
            <a href={mapsLink(parent.latitude, parent.longitude)} target="_blank" rel="noreferrer" className="-mt-4 ml-12 block text-xs font-bold text-blue-600 hover:underline">Lihat titik rumah di peta</a>
          )}

          <hr className="border-gray-100" />

          {/* SECTION INTEGRASI SUB-ALUR: DATA ANAK */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {/* Ukuran judul section dinaikkan ke text-base */}
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-1.5">
                <GraduationCap className="w-5 h-5 text-blue-600" /> Plotting Anak Didik
              </h3>
              
              <button
                onClick={() => { onClose(); navigate(`/admin/students/new?parent=${parent.id}`); }}
                className="text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-xl flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Daftarkan Murid Baru
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {parent.students?.length > 0 ? (
                parent.students.map((student) => (
                  <div key={student.id} className="border border-gray-150 bg-gray-50/40 rounded-xl p-3.5 flex justify-between items-center group hover:border-blue-300 transition-colors">
                    <div>
                      {/* Judul nama anak dinaikkan ke text-sm */}
                      <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-all">{student.full_name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">NIS: {student.nis || "Menunggu Aktivasi"}</div>
                    </div>
                    <span className="text-xs bg-white px-2.5 py-0.5 border rounded font-bold text-gray-600 uppercase">
                      {student.education_level || ""} / Kelas {student.grade || "SD"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  Belum ada data siswa terikat. Silakan klik tombol di atas untuk mendaftarkan anak dari wali murid ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-komponen baris info internal dinaikkan skalanya ke text-sm
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3.5 items-start text-sm">
      <div className="text-blue-600 mt-0.5 bg-blue-50 p-2 rounded-xl shrink-0">{icon}</div>
      <div className="space-y-0.5">
        {/* Judul label dinaikkan ke text-[11px] */}
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        {/* Isian value dinaikkan ke text-base */}
        <div className="font-bold text-gray-900 text-base leading-tight">{value}</div>
      </div>
    </div>
  );
}