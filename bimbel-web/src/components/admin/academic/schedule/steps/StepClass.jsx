import React, { useMemo, useState } from "react";
import { Search, Users, BookOpen } from "lucide-react";

export default function StepClass({ formData, setFormData, classList }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return classList.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase()));
  }, [classList, search]);

  const handleSelectClass = (cls) => {
    // Siapkan Pola Awal dari relasi class_subjects
    const initialPatterns = (cls.class_subjects || []).map((cs) => ({
      subject_id: cs.subject_id,
      subject_name: cs.subject_name,
      tentor_id: cs.tentor_id,
      tentor_name: cs.tentor_name,
      meeting_target: cs.meeting_target || 16,
      day_of_week: "",
      start_time: "",
      end_time: "",
    }));

    setFormData({
      ...formData,
      class_id: cls.id,
      class_type: cls.class_type,
      patterns: initialPatterns
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari kelas yang akan di-plot..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
        {filtered.map((cls) => {
          const isSelected = formData.class_id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => handleSelectClass(cls)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-200 hover:border-blue-300 bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{cls.name}</h4>
                  <span className="text-[10px] font-mono text-gray-500">{cls.code}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded uppercase">
                  {cls.class_type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 font-bold"><Users size={12} className="text-blue-500"/> {cls.students_count || 0}/{cls.max_students}</span>
                <span className="flex items-center gap-1 font-bold"><BookOpen size={12} className="text-purple-500"/> {cls.subject_count || 0} Mapel</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}