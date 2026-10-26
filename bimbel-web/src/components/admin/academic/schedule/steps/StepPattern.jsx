import React from "react";
import { Clock,AlertTriangle } from "lucide-react";

export default function StepPattern({ formData, setFormData, conflictError, setConflictError }) {
  const updatePattern = (index, field, value) => {
    if (conflictError && setConflictError) {
      setConflictError(null);
    }

    const newPatterns = [...formData.patterns];
    newPatterns[index][field] = value;
    setFormData({ ...formData, patterns: newPatterns });
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 font-medium">
        Tentukan Hari dan Jam baku untuk masing-masing mata pelajaran. Pola ini akan diduplikasi secara otomatis untuk memenuhi target sesi KBM.
      </div>

      {conflictError && (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3 shadow-sm animate-in zoom-in-95">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-rose-800 leading-relaxed">{conflictError}</p>
        </div>
      )}

      <div className="space-y-3">
        {formData.patterns.map((pat, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-sm text-gray-900">{pat.subject_name}</h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                👨‍🏫 Tentor: <strong className="text-gray-700">{pat.tentor_name || "Belum Diplot"}</strong>
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                Target: {pat.meeting_target} Pertemuan
              </span>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Hari</label>
                <select
                  value={pat.day_of_week}
                  onChange={(e) => updatePattern(idx, "day_of_week", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold bg-gray-50"
                >
                  <option value="">-- Hari --</option>
                  <option value="1">Senin</option><option value="2">Selasa</option>
                  <option value="3">Rabu</option><option value="4">Kamis</option>
                  <option value="5">Jumat</option><option value="6">Sabtu</option><option value="0">Minggu</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mulai</label>
                <input
                  type="time"
                  value={pat.start_time}
                  onChange={(e) => updatePattern(idx, "start_time", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold font-mono bg-gray-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Selesai</label>
                <input
                  type="time"
                  value={pat.end_time}
                  onChange={(e) => updatePattern(idx, "end_time", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold font-mono bg-gray-50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}