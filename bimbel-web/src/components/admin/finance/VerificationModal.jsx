import React, { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, FileWarning, Undo2 } from "lucide-react";
import { approvePayment, rejectPayment, getPaymentProof, requestReversal, paymentBadge, REVERSAL_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

/**
 * Verifikasi bukti transfer orang tua: tampilkan bukti, lalu terima atau tolak.
 */
export default function VerificationModal({ open, payment, onClose, onDone }) {
  const [proof, setProof] = useState(null); // { url, type }
  const [proofError, setProofError] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [reversalMode, setReversalMode] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !payment) return;
    setRejectMode(false);
    setReversalMode(false);
    setReason("");
    setError("");
    setProof(null);
    setProofError("");
    if (!payment.has_proof) return;

    let url;
    getPaymentProof(payment.id)
      .then(res => {
        url = URL.createObjectURL(res.data);
        setProof({ url, type: res.data.type });
      })
      .catch(() => setProofError("Bukti pembayaran tidak dapat dimuat."));
    return () => url && URL.revokeObjectURL(url);
  }, [open, payment]);

  if (!open || !payment) return null;

  const run = async (action, message) => {
    setSaving(true);
    setError("");
    try {
      await action();
      onDone(message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Verifikasi gagal."));
    } finally {
      setSaving(false);
    }
  };

  const isPending = payment.status === "PENDING";
  const invoice = payment.invoices?.[0];
  const reversal = payment.reversal;
  // Reversal bisa diajukan untuk pembayaran diterima yang belum punya reversal aktif
  const canReverse = payment.status === "CONFIRMED" && (!reversal || reversal.status === "REJECTED");
  const badge = paymentBadge(payment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">{payment.payment_no}</p>
            <h2 className="text-xl font-bold text-gray-900">Verifikasi Pembayaran</h2>
            <p className="text-sm text-gray-500">{payment.student_name} • dikirim {payment.submitted_by || "-"} pada {payment.created_at} WIB</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-2xl min-h-[260px] flex items-center justify-center overflow-hidden">
            {!payment.has_proof ? (
              <p className="text-sm text-gray-400">Pembayaran ini dicatat Admin (tanpa bukti).</p>
            ) : proofError ? (
              <p className="text-sm text-rose-600 flex items-center gap-2"><FileWarning className="w-4 h-4" /> {proofError}</p>
            ) : !proof ? (
              <p className="text-sm text-gray-400">Memuat bukti...</p>
            ) : proof.type === "application/pdf" ? (
              <iframe src={proof.url} title="Bukti transfer" className="w-full h-[420px]" />
            ) : (
              <a href={proof.url} target="_blank" rel="noreferrer"><img src={proof.url} alt="Bukti transfer" className="max-h-[420px] object-contain" /></a>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase">Nominal Dibayar</p>
              <p className="text-2xl font-black text-blue-900">{formatRupiah(payment.total_amount)}</p>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-gray-500">Tagihan</dt><dd className="font-semibold">{invoice?.invoice_no}</dd></div>
              {invoice?.remaining_amount !== null && invoice?.remaining_amount !== undefined && (
                <div className="flex justify-between"><dt className="text-gray-500">Sisa tagihan saat ini</dt><dd className="font-semibold">{formatRupiah(invoice.remaining_amount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-gray-500">Tanggal transfer</dt><dd className="font-semibold">{payment.payment_date}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Bank / channel</dt><dd className="font-semibold">{payment.payment_channel || "-"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">No. referensi</dt><dd className="font-semibold">{payment.reference_no || "-"}</dd></div>
              {payment.note && <div><dt className="text-gray-500">Catatan pengirim</dt><dd className="mt-0.5">{payment.note}</dd></div>}
            </dl>
            {!isPending && (
              <div className="pt-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badge?.className}`}>{badge?.label}</span>
                {payment.reject_reason && <p className="mt-2 text-rose-700">Alasan: {payment.reject_reason}</p>}
                {payment.received_by && <p className="mt-1 text-xs text-gray-400">Diverifikasi oleh {payment.received_by}</p>}
              </div>
            )}
            {reversal && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1.5"><Undo2 className="w-3.5 h-3.5" /> Reversal: <span className={`px-1.5 py-0.5 rounded ${REVERSAL_STATUS[reversal.status]?.className}`}>{REVERSAL_STATUS[reversal.status]?.label}</span></p>
                <p className="text-slate-600">{reversal.reason}</p>
                {reversal.reject_note && <p className="text-slate-500">Ditolak: {reversal.reject_note}</p>}
                {reversal.status === "PENDING" && <p className="text-slate-500">Putuskan di tab Reversal.</p>}
              </div>
            )}
            {reversalMode && (
              <textarea autoFocus rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan reversal (wajib, min. 10 karakter), mis. salah input siswa" className="w-full rounded-xl border px-3 py-2 text-sm" />
            )}

            {rejectMode && (
              <textarea autoFocus rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan penolakan, akan dilihat orang tua (wajib)" className="w-full rounded-xl border px-3 py-2 text-sm" />
            )}
            {error && <p className="font-medium text-red-600">{error}</p>}
          </div>
        </div>

        {canReverse && (
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
            {reversalMode ? (
              <>
                <button onClick={() => setReversalMode(false)} className="px-4 py-2.5 text-sm text-gray-500">Batal</button>
                <button onClick={() => run(() => requestReversal(payment.id, reason), "Reversal diajukan. Setujui di tab Reversal.")} disabled={reason.trim().length < 10 || saving} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">Ajukan Reversal</button>
              </>
            ) : (
              <button onClick={() => setReversalMode(true)} className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold flex items-center gap-1.5"><Undo2 className="w-4 h-4" /> Batalkan dengan Reversal</button>
            )}
          </div>
        )}

        {isPending && (
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
            {rejectMode ? (
              <>
                <button onClick={() => setRejectMode(false)} className="px-4 py-2.5 text-sm text-gray-500">Batal</button>
                <button onClick={() => run(() => rejectPayment(payment.id, reason), "Pembayaran ditolak.")} disabled={!reason.trim() || saving} className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">Tolak Pembayaran</button>
              </>
            ) : (
              <>
                <button onClick={() => setRejectMode(true)} className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Tolak</button>
                <button onClick={() => run(() => approvePayment(payment.id), "Pembayaran diterima dan tagihan diperbarui.")} disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Terima Pembayaran</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
