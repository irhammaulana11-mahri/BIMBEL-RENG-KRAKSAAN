import { useEffect, useState } from "react";
import { X, MapPinned } from "lucide-react";
import LocationPicker from "../ui/LocationPicker";
import { getApiErrorMessage } from "@/utils/apiError";

const EMPTY = { location_name: "", address: "", latitude: "", longitude: "", reason: "" };

/**
 * Form pengajuan lokasi les sementara untuk satu sesi (tentor & orang tua).
 * onSubmit(data) melempar error agar pesan validasi tampil di modal.
 */
export default function LocationChangeModal({ open, session, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(EMPTY); setError(""); }
  }, [open]);

  if (!open || !session) return null;

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim pengajuan."));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} type="button" className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl">
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><MapPinned size={20} /></div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">Ajukan Lokasi Les Sementara</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {session.subject_name} • {session.class_name} • {session.session_date} {session.start_time}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 bg-slate-50 border border-gray-100 rounded-xl p-3 mb-3">
          Berlaku hanya untuk sesi ini setelah disetujui Admin. Tentor wajib absen di titik ini (toleransi 100 m).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Tempat</label>
            <input required value={form.location_name} onChange={(e) => set({ location_name: e.target.value })} className={inputClass} placeholder="Contoh: Rumah nenek" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alamat</label>
            <textarea required rows={2} value={form.address} onChange={(e) => set({ address: e.target.value })} className={`${inputClass} resize-none`} placeholder="Jl. ..., Desa, Kecamatan" />
          </div>
          <LocationPicker
            radius={100}
            height={220}
            value={{ latitude: form.latitude, longitude: form.longitude }}
            onChange={({ latitude, longitude }) => set({ latitude, longitude })}
          />
          <div>
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alasan</label>
            <textarea required rows={2} value={form.reason} onChange={(e) => set({ reason: e.target.value })} className={`${inputClass} resize-none`} placeholder="Contoh: siswa sedang menginap di rumah nenek" />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="pt-3 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold">
              {saving ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
