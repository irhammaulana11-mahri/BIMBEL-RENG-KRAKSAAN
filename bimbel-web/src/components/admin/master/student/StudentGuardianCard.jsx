import React, { useState } from "react";
import { User, Phone, Mail, MapPin, Users, LoaderCircle, UserPlus, RefreshCw, X } from "lucide-react";
import ParentPickerModal from "./ParentPickerModal";

export default function StudentGuardianCard({ parent, onSelectParent, loading = false }) {
  const [openModal, setOpenModal] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        
        {/* Header dengan Aksi Tambah / Ganti */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-950 tracking-tight">Informasi Orang Tua / Wali</h2>
            <p className="text-xs text-gray-400 mt-0.5">Data orang tua/wali yang akan dikaitkan dengan murid.</p>
          </div>

          {/* Tombol Aksi Kanan jika Sudah Terpilih */}
          {parent && (
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} /> Ganti Wali
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {!parent ? (
            /* Keadaan Kosong (Empty State) */
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <p className="font-bold text-gray-900 text-base">Belum memilih Orang Tua / Wali</p>
              <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
                Silakan pilih data orang tua/wali murid terlebih dahulu dari basis data master.
              </p>

              {/* Tombol Pemicu Modal Selection */}
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <UserPlus size={16} /> Pilih Orang Tua / Wali
              </button>
            </div>
          ) : (
            /* Keadaan Terisi (Selected State) */
            <div className="space-y-4">
              <InfoRow icon={<User size={16} />} label="Nama Wali" value={parent.full_name || parent.parent_name} />
              <InfoRow icon={<Phone size={16} />} label="Nomor HP" value={parent.phone || parent.user?.phone} isMono />
              <InfoRow icon={<Mail size={16} />} label="Email" value={parent.user?.email || parent.email} />
              <InfoRow icon={<MapPin size={16} />} label="Alamat Domisili" value={parent.address} />
              <InfoRow 
                icon={<Users size={16} />} 
                label="Jumlah Anak Terikat" 
                value={`${parent.students?.length ?? parent.students_count ?? 0} Murid`} 
              />

              {/* Option Unlink/Lepas Wali */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectParent(null)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <X size={14} /> Lepas kaitan orang tua ini
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Modal Picker */}
      <ParentPickerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSelect={(selectedParent) => onSelectParent(selectedParent)}
      />
    </>
  );
}

/* =======================================================
   Reusable InfoRow
======================================================= */
function InfoRow({ icon, label, value, isMono = false }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="rounded-xl bg-blue-50 p-2 text-blue-600 shrink-0">{icon}</div>
      <div className="flex-1 overflow-hidden">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className={`mt-0.5 font-bold text-gray-900 text-sm truncate ${isMono ? "font-mono" : ""}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
}