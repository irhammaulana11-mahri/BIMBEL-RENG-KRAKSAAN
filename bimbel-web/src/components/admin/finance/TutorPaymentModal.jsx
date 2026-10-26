import React, { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { transferPayroll } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, todayDate } from "@/utils/format";

/**
 * Catat transfer honor satu tentor pada payroll yang sudah disetujui.
 */
export default function TutorPaymentModal({ open, payrollId, tentor, onClose, onDone }) {
  const [form, setForm] = useState({ transfer_date: todayDate(), source_account: "", reference_no: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ transfer_date: todayDate(), source_account: "", reference_no: "", note: "" });
    setError("");
  }, [open, tentor]);

  if (!open || !tentor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await transferPayroll(payrollId, { ...form, tentor_id: tentor.tentor_id });
      onDone(`Transfer honor ${tentor.tentor_name} dicatat.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mencatat transfer."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-gray-900">Transfer Honor</h2>
        <p className="text-sm text-gray-500 mb-5">{tentor.tentor_name} • {tentor.total_sessions} sesi</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-emerald-50 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">Total Honor</span>
            <span className="text-2xl font-black text-emerald-900">{formatRupiah(tentor.total_amount)}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Transfer</label>
            <input type="date" required max={todayDate()} value={form.transfer_date} onChange={e => setForm({ ...form, transfer_date: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <input placeholder="Rekening sumber (mis. BCA - Rek Utama Bimbel)" value={form.source_account} onChange={e => setForm({ ...form, source_account: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="No. referensi transfer" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Catatan (opsional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {saving ? "Menyimpan..." : "Tandai Sudah Ditransfer"}
          </button>
        </form>
      </div>
    </div>
  );
}
