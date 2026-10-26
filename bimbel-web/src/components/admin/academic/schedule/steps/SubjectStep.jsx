import React, { useMemo } from "react";
import { BookOpen, Lock } from "lucide-react";

export default function SubjectStep({
  selectedClassObj,
  formData,
  setFormData,
  filteredSubjects = [],
  disabled = false,
}) {
  const selectedSubject = useMemo(() => {
    return filteredSubjects.find((s) => String(s.id) === String(formData.subject_id));
  }, [filteredSubjects, formData.subject_id]);

  // 🔒 MODE EDIT: Sembunyikan Select, tampilkan Card Terkunci
  if (disabled) {
    return (
      <div className="space-y-3 animate-in fade-in">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
          <BookOpen size={16} className="text-blue-600" /> 2. Mata Pelajaran Terpilih
        </label>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 font-mono font-black text-xs rounded-xl border border-blue-200 shrink-0">
              {selectedSubject?.code || "MAPEL"}
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900">
                {selectedSubject?.subject_name || selectedSubject?.name || "-"}
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Jenjang: {selectedSubject?.education_level || selectedClassObj?.education_level || "-"}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold shrink-0">
            <Lock size={12} /> Terkunci (Edit)
          </span>
        </div>
      </div>
    );
  }

  // 🟢 MODE BUAT BARU: Select Mapel
  return (
    <div className="space-y-3 animate-in slide-in-from-right-4">
      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase">
        <BookOpen size={16} className="text-blue-600" /> 2. Pilih Mata Pelajaran
      </label>
      <select
        required
        value={formData.subject_id}
        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
        className="w-full rounded-xl border border-gray-200 p-3.5 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
      >
        <option value="">-- Pilih Mata Pelajaran --</option>
        {filteredSubjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.subject_name || s.name} ({s.code || "-"})
          </option>
        ))}
      </select>
    </div>
  );
}