import React from "react";
import { Save, CheckCircle2, Info, Sparkles } from "lucide-react";

export default function TentorSummaryCard({ formData, loading, onCancel }) {
  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
      
      {/* Header Summary */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">4. Ringkasan Registrasi</h3>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
          formData.is_active 
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-rose-500/20 text-rose-400 border-rose-500/30"
        }`}>
          {formData.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Items Detail */}
      <div className="space-y-3 text-xs">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Tentor</p>
          <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.name || "-"}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK</p>
          <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.nik || "-"}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat</p>
          <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.address || "-"}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendidikan Terakhir</p>
          <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.education || "-"}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Login</p>
          <p className="font-mono text-slate-300 truncate mt-0.5">{formData.email || "-"}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kluster Spesialisasi</p>
          <span className="inline-block font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 mt-1">
            {formData.specialization}
          </span>
        </div>

        {/* Selected Subjects List */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mapel Dipilih</p>
            <span className="font-bold text-emerald-400 text-xs">
              {formData.selectedSubjects.length} Mata Pelajaran
            </span>
          </div>

          {formData.selectedSubjects.length === 0 ? (
            <p className="text-slate-500 italic text-[11px]">Belum ada mapel terpilih</p>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {formData.selectedSubjects.map((sub) => (
                <div key={sub.id} className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{sub.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
        <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <span>Akun login user dan sinkronisasi mapel akan diproses langsung secara otomatis.</span>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Save size={16} />
          {loading ? "Menyimpan Data..." : "Simpan Data Tentor"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-colors text-center cursor-pointer"
        >
          Batal
        </button>
      </div>

    </div>
  );
}