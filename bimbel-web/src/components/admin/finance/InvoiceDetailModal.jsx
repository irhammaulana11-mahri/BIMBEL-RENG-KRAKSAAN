import React, { useEffect, useState } from "react";
import { X, Banknote, Ban, AlertTriangle } from "lucide-react";
import { getInvoice, cancelInvoice, INVOICE_STATUS, PAYMENT_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod } from "@/utils/format";

export default function InvoiceDetailModal({ open, invoiceId, onClose, onRecordPayment, onChanged }) {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [cancelMode, setCancelMode] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => getInvoice(invoiceId)
    .then(res => setInvoice(res.data.data))
    .catch(err => setError(getApiErrorMessage(err, "Gagal memuat tagihan.")));

  useEffect(() => {
    if (!open || !invoiceId) return;
    setInvoice(null);
    setError("");
    setCancelMode(false);
    setReason("");
    load();
  }, [open, invoiceId]);

  if (!open) return null;

  const handleCancel = async () => {
    setSaving(true);
    setError("");
    try {
      await cancelInvoice(invoiceId, reason);
      await load();
      setCancelMode(false);
      onChanged("Tagihan dibatalkan.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal membatalkan tagihan."));
    } finally {
      setSaving(false);
    }
  };

  const status = invoice ? INVOICE_STATUS[invoice.status] : null;
  const isOpen = invoice && ["UNPAID", "PARTIAL"].includes(invoice.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">{invoice?.invoice_no || "Tagihan"}</p>
            <h2 className="text-xl font-bold text-gray-900">{invoice?.student_name}</h2>
            {invoice && (
              <p className="text-xs text-gray-500 mt-0.5">
                {invoice.class_name} • {invoice.period_month ? formatPeriod(`${invoice.period_year}-${String(invoice.period_month).padStart(2, "0")}`) : "Tagihan manual"}
                {invoice.parent_names?.length > 0 && ` • Wali: ${invoice.parent_names.join(", ")}`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        </div>

        {!invoice ? (
          <p className="p-10 text-center text-sm text-gray-400">{error || "Memuat tagihan..."}</p>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${status?.className}`}>{status?.label}</span>
              {invoice.is_overdue && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Lewat jatuh tempo</span>}
              <span className="text-xs text-gray-500">Terbit {invoice.issue_date} • Jatuh tempo {invoice.due_date}</span>
            </div>

            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 uppercase border-b"><th className="py-2 text-left">Rincian</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Harga</th><th className="py-2 text-right">Subtotal</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items?.map(item => (
                  <tr key={item.id}>
                    <td className="py-2"><p className="font-medium text-gray-800">{item.item_name}</p>{item.description && <p className="text-xs text-gray-400">{item.description}</p>}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatRupiah(item.unit_price)}</td>
                    <td className="py-2 text-right font-semibold">{formatRupiah(item.subtotal)}{item.discount > 0 && <span className="block text-[10px] text-gray-400">diskon {formatRupiah(item.discount)}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-1 text-sm">
              {invoice.discount > 0 && <div className="flex justify-between text-gray-500"><span>Diskon tagihan</span><span>- {formatRupiah(invoice.discount)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatRupiah(invoice.total_amount)}</span></div>
              <div className="flex justify-between text-emerald-700"><span>Terbayar</span><span>{formatRupiah(invoice.paid_amount)}</span></div>
              <div className="flex justify-between text-rose-700 font-bold"><span>Sisa</span><span>{formatRupiah(invoice.remaining_amount)}</span></div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Riwayat Pembayaran</p>
              {invoice.payments?.length ? (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                  {invoice.payments.map(p => (
                    <div key={p.payment_id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{p.payment_no} • {p.payment_method === "CASH" ? "Tunai" : "Transfer"}</p>
                        <p className="text-xs text-gray-400">{p.payment_date}{p.reject_reason ? ` • Ditolak: ${p.reject_reason}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatRupiah(p.amount)}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PAYMENT_STATUS[p.status]?.className}`}>{PAYMENT_STATUS[p.status]?.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">Belum ada pembayaran.</p>}
            </div>

            {invoice.status === "CANCELLED" && invoice.cancel_reason && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">Alasan pembatalan: {invoice.cancel_reason}</p>
            )}

            {cancelMode && (
              <div className="border border-rose-100 bg-rose-50/50 rounded-xl p-3 space-y-2">
                <input autoFocus value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan pembatalan (wajib)" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setCancelMode(false)} className="px-3 py-1.5 text-sm text-gray-500">Batal</button>
                  <button onClick={handleCancel} disabled={!reason.trim() || saving} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Batalkan Tagihan</button>
                </div>
              </div>
            )}

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}

        {isOpen && !cancelMode && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap justify-end gap-2">
            {invoice.paid_amount === 0 && (
              <button onClick={() => setCancelMode(true)} className="px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5"><Ban className="w-4 h-4" /> Batalkan</button>
            )}
            <button onClick={() => onRecordPayment(invoice)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5"><Banknote className="w-4 h-4" /> Catat Pembayaran</button>
          </div>
        )}
      </div>
    </div>
  );
}
