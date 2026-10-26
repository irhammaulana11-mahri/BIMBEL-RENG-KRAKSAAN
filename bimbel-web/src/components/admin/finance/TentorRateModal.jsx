import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { getTentorRates, updateTentorRate } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

/**
 * Atur tarif honor per sesi setiap tentor aktif.
 * Tarif disalin ke payroll saat disusun, jadi perubahan tidak mengubah payroll yang sudah disetujui.
 */
export default function TentorRateModal({ open, onClose, onSaved }) {
  const [tentors, setTentors] = useState([]);
  const [draft, setDraft] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    getTentorRates()
      .then(res => {
        const list = res.data.data || [];
        setTentors(list);
        setDraft(Object.fromEntries(list.map(t => [t.id, t.rate_per_session])));
      })
      .catch(() => setError("Gagal memuat tarif tentor."));
  }, [open]);

  if (!open) return null;

  const save = async (tentor) => {
    setSavingId(tentor.id);
    setError("");
    try {
      await updateTentorRate(tentor.id, Number(draft[tentor.id]) || 0);
      setTentors(prev => prev.map(t => t.id === tentor.id ? { ...t, rate_per_session: Number(draft[tentor.id]) || 0 } : t));
      onSaved?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan tarif."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-gray-900">Tarif Honor per Sesi</h2>
        <p className="text-sm text-gray-500 mb-5">Honor = tarif × sesi HADIR yang selesai. Setelah mengubah tarif, susun ulang payroll yang masih draft.</p>

        {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl">
          {tentors.map(t => {
            const changed = Number(draft[t.id]) !== Number(t.rate_per_session);
            return (
              <div key={t.id} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.specialization || "-"} • saat ini {formatRupiah(t.rate_per_session)}</p>
                </div>
                <input type="number" min={0} step={1000} value={draft[t.id] ?? 0} onChange={e => setDraft({ ...draft, [t.id]: e.target.value })} className={`w-32 rounded-lg border px-2 py-2 text-sm text-right ${Number(t.rate_per_session) <= 0 ? "border-rose-300" : ""}`} />
                <button onClick={() => save(t)} disabled={!changed || savingId === t.id} className="p-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-200 disabled:text-gray-400" title="Simpan"><Check className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
