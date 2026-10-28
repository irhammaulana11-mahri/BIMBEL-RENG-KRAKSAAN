import React from "react";
import { X, Edit } from "lucide-react";
import ParentForm from "./ParentForm";

export default function ParentModal({ open, onClose, data, onSubmit, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex items-start gap-2.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">Koreksi Profil Wali Murid</h2>
            <p className="text-xs text-gray-400 mt-0.5">Lakukan pembaruan nomor kontak operasional atau ubah rincian alamat tempat tinggal privat.</p>
          </div>
        </div>

        {/* Merendah form isian utama data */}
        <ParentForm initialData={data} onSubmit={onSubmit} loading={loading} onClose={onClose} />
      </div>
    </div>
  );
}