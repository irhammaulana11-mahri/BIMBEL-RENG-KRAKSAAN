import { useEffect, useState } from "react";
import PackageForm from "./PackageForm";
import { createPackage,updatePackage, } from "../../../services/packageService";

export default function PackageModal({open,onClose,data,onSuccess,}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
      package_name: "",
      education_level: "",
      description: "",
      price: 0,
      meeting_per_month: 0,
      duration_minutes: 0,
      is_home_visit: false,
      is_building_class: true,
      is_active: true,
      card_color: "#2563eb",
    });

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);

        if (data) {
          await updatePackage(data.id,form);
        } else {
          await createPackage(
            form
          );
        }
        onSuccess();
        onClose();
      } finally {
        setLoading(false);
      }
    };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {data ? "Edit Paket" : "Tambah Paket"}
          </h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <PackageForm form={form} setForm={setForm}/>
          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className=" px-4 py-2 border rounded-xl">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}