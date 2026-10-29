import React, { useEffect, useState } from "react";
import { X, Send, Paperclip } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import ApprovalFields, { approvalReady } from "./ApprovalFields";
import { transferPayroll } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, todayDate } from "@/utils/format";

const EMPTY = { transfer_date: "", source_account: "", reference_no: "", note: "" };

/**
 * Catat transfer honor satu tentor pada payroll yang sudah disetujui. Nomor referensi dan berkas bukti
 * wajib; tentor kemudian diminta mengonfirmasi penerimaan di portalnya.
 */
export default function TutorPaymentModal({ open, payroll, mode, tentor, onClose, onDone }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [proof, setProof] = useState(null);
  const [password, setPassword] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, transfer_date: todayDate() });
    setProof(null);
    setPassword("");
    setApprovalNote("");
    setError("");
  }, [open, tentor]);

  if (!open || !tentor || !payroll) return null;

  // Akun ini juga menyusun atau menyetujui payroll yang sama
  const isSelf = [payroll.generated_by_id, payroll.approved_by_id].includes(user?.id);
  const ready = !saving && form.reference_no.trim() && proof && approvalReady({ mode, isSelf, password, note: approvalNote });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries({ ...form, tentor_id: tentor.tentor_id, password, approval_note: approvalNote }).forEach(([k, v]) => v && data.append(k, v));
      data.append("proof", proof);
      await transferPayroll(payroll.id, data);
      onDone(`Transfer honor ${tentor.tentor_name} dicatat. Tentor diminta mengonfirmasi penerimaan.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mencatat transfer."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
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
          <input required placeholder="No. referensi transfer (wajib)" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
            <Paperclip className="w-4 h-4" />
            <span className="truncate">{proof ? proof.name : "Unggah bukti transfer (wajib: JPG/PNG/PDF, maks 5 MB)"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setProof(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <input placeholder="Catatan (opsional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />

          <ApprovalFields
            mode={mode} isSelf={isSelf} password={password} note={approvalNote} onPassword={setPassword} onNote={setApprovalNote}
            selfMessage="Anda juga menyusun atau menyetujui payroll ini."
            separatedMessage="Transfer harus dicatat akun yang berbeda dari penyusun dan penyetuju payroll."
          />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={!ready} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {saving ? "Menyimpan..." : "Catat Transfer"}
          </button>
        </form>
      </div>
    </div>
  );
}
