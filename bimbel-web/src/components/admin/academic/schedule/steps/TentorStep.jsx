import React, { useMemo } from "react";
import { User, Lock } from "lucide-react";

export default function TentorStep({
  subjectList = [],
  formData,
  setFormData,
  filteredTentors = [],
  disabled = false,
}) {
  const selectedTentor = useMemo(() => {
    return filteredTentors.find((t) => String(t.id) === String(formData.tentor_id));
  }, [filteredTentors, formData.tentor_id]);

  const tentorNameDisplay =
    selectedTentor?.user?.full_name ||
    selectedTentor?.user?.name ||
    selectedTentor?.name ||
    selectedTentor?.tentor_name ||
    "-";

  // 🔒 MODE EDIT: Sembunyikan Select, tampilkan Card Terkunci
  if (disabled) {
    return (
      <div className="space-y-3 animate-in fade-in">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
          <User size={16} className="text-amber-500" /> 3. Tentor Pengampu
        </label>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl font-bold text-xs shrink-0">
              <User size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900">{tentorNameDisplay}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Tentor Pengampu Terkunci</p>
            </div>
          </div>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold shrink-0">
            <Lock size={12} /> Terkunci (Edit)
          </span>
        </div>
      </div>
    );
  }

  // 🟢 MODE BUAT BARU: Select Tentor
  return (
    <div className="space-y-3 animate-in slide-in-from-right-4">
      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
        <User size={16} className="text-amber-500" /> 3. Pilih Tentor Pengampu
      </label>
      <select
        required
        value={formData.tentor_id}
        onChange={(e) =>
          setFormData({
            ...formData,
            tentor_id: e.target.value,
            day_of_week: "",
            start_time: "",
            end_time: "",
          })
        }
        className="w-full rounded-xl border border-gray-200 p-3.5 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
      >
        <option value="">-- Pilih Tentor --</option>
        {filteredTentors.map((t) => (
          <option key={t.id} value={t.id}>
            {t.user?.full_name || t.user?.name || t.name || t.tentor_name}
          </option>
        ))}
      </select>
    </div>
  );
}