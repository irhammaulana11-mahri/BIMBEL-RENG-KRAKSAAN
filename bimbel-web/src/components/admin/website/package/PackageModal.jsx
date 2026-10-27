import React, { useEffect, useState } from "react";
import { X, Layers } from "lucide-react";
import PackageForm from "./PackageForm";
import { createPackage, updatePackage } from "@/services/admin/website/packageService";
import { getApiErrorMessage } from "@/utils/apiError";

const EMPTY_FORM = {
    package_name: "",
    education_level: "",
    description: "",
    default_price: 0,
    meeting_per_month: 8,
    duration_minutes: 90,
    class_type: "REGULER",
    is_active: true,
  };

export default function PackageModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setError("");
    setForm(data
      ? {
          package_name: data.package_name || "",
          education_level: data.education_level || "",
          description: data.description || "",
          default_price: Number(data.default_price || 0),
          meeting_per_month: data.meeting_per_month || 0,
          duration_minutes: data.duration_minutes || 0,
          class_type: data.class_type || "REGULER",
          is_active: Boolean(data.is_active),
        }
      : EMPTY_FORM);
  }, [data, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (data) await updatePackage(data.id, form);
      else await createPackage(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan paket."));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-5 flex items-start gap-2.5 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {data ? "Koreksi Profil Paket Belajar" : "Konfigurasi Paket Bimbingan Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Atur skema pertemuan berkala, harga kuota, dan tipe kehadiran absensi.</p>
          </div>
        </div>

        {/* Form Integrasi */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <PackageForm form={form} setForm={setForm} />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          {/* Footer Sticky Tombol Aksi Kerja Akhir */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan Konfigurasi..." : "Terbitkan Paket Akademik"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}