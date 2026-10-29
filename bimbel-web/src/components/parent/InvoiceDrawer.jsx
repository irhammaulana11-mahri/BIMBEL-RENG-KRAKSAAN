import React, { useEffect, useState } from "react";
import { X, FileDown, Upload, Hourglass, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getParentInvoice, INVOICE_STATUS, paymentBadge } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod } from "@/utils/format";
import { downloadFile } from "@/utils/download";

const fmtDate = (v) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-");

/**
 * Drawer detail invoice orang tua: rincian, pembayaran, unduh PDF, dan tombol konfirmasi bayar.
 */
export default function InvoiceDrawer({ invoiceId, onClose, onPay }) {
  const [inv, setInv] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setInv(null);
    setError("");
    if (invoiceId) getParentInvoice(invoiceId).then((res) => setInv(res.data.data)).catch((err) => setError(getApiErrorMessage(err, "Gagal memuat invoice.")));
  }, [invoiceId]);

  if (!invoiceId) return null;

  const pdf = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/parent/invoices/${invoiceId}/pdf`, `Invoice-${inv?.invoice_no || "tagihan"}.pdf`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengunduh PDF."));
    } finally {
      setDownloading(false);
    }
  };

  const isOpen = inv && ["UNPAID", "PARTIAL"].includes(inv.status);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in" />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[520px] bg-white shadow-2xl flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-emerald-50 to-teal-50/60 relative">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-white/70 rounded-xl"><X size={20} /></button>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-white/80 px-2.5 py-1 rounded-md">Detail Invoice</span>
          <h2 className="text-xl font-black text-gray-950 mt-2">{inv?.invoice_no || "Memuat..."}</h2>
          {inv && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${INVOICE_STATUS[inv.status]?.className}`}>{INVOICE_STATUS[inv.status]?.label}</span>
              {inv.is_overdue && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1"><AlertTriangle size={11} /> Lewat jatuh tempo</span>}
              {inv.invoice_type === "ADJUSTMENT" && <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">Penyesuaian{inv.adjusts_invoice_no ? ` atas ${inv.adjusts_invoice_no}` : ""}</span>}
            </div>
          )}
          {inv?.credit_applied > 0 && <p className="text-xs text-emerald-800 mt-2">Kredit dari koreksi absensi dipakai: {formatRupiah(inv.credit_applied)}</p>}
          {inv?.refunds?.length > 0 && <p className="text-xs text-emerald-800">Dana dikembalikan: {inv.refunds.map(r => `${formatRupiah(r.amount)} (${r.paid_at})`).join(", ")}</p>}
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          {!inv && !error && <p className="text-center text-sm text-gray-400 py-10">Memuat invoice...</p>}

          {inv && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Siswa", `${inv.student_name} (${inv.student_nis})`],
                  ["Kelas", inv.class_name || "-"],
                  ["Periode", inv.period_month ? formatPeriod(`${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`) : "Tagihan lainnya"],
                  ["Paket", inv.package_name || "-"],
                  ["Tanggal terbit", fmtDate(inv.issue_date)],
                  ["Jatuh tempo", fmtDate(inv.due_date)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                    <p className="font-bold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="ui-table w-full text-sm">
                  <thead><tr><th className="p-3 text-left">Rincian</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Subtotal</th></tr></thead>
                  <tbody>
                    {(inv.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="p-3"><p className="font-semibold text-gray-800">{item.item_name}</p>{item.description && <p className="text-xs text-gray-400">{item.description}</p>}<p className="text-xs text-gray-500">{formatRupiah(item.unit_price)}{item.discount > 0 ? ` • diskon ${formatRupiah(item.discount)}` : ""}</p></td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right font-bold">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 space-y-1 text-sm">
                  {inv.discount > 0 && <p className="flex justify-between"><span className="text-gray-500">Diskon tagihan</span><span>- {formatRupiah(inv.discount)}</span></p>}
                  <p className="flex justify-between font-bold"><span>Total tagihan</span><span>{formatRupiah(inv.total_amount)}</span></p>
                  <p className="flex justify-between text-emerald-700"><span>Sudah dibayar</span><span>{formatRupiah(inv.paid_amount)}</span></p>
                  <p className="flex justify-between text-lg font-black text-gray-950 border-t border-gray-200 pt-1"><span>Sisa tagihan</span><span>{formatRupiah(inv.remaining_amount)}</span></p>
                </div>
              </div>

              {(inv.payments || []).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Riwayat Pembayaran</h3>
                  {inv.payments.map((p) => (
                    <div key={p.payment_id} className="flex items-center justify-between text-sm bg-white border border-gray-100 rounded-xl px-3 py-2">
                      <div>
                        <p className="font-bold text-gray-800">{p.payment_no}</p>
                        <p className="text-xs text-gray-500">{fmtDate(p.payment_date)} • {p.payment_method === "CASH" ? "Tunai" : "Transfer"}{p.reject_reason ? ` • Ditolak: ${p.reject_reason}` : ""}</p>
                        {p.reversed && <p className="text-xs text-slate-500">Dibatalkan admin: {p.reversal_reason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-black">{formatRupiah(p.amount)}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${paymentBadge(p)?.className}`}>{paymentBadge(p)?.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {inv && (
          <div className="p-5 border-t border-gray-100 grid grid-cols-2 gap-2">
            <button onClick={pdf} disabled={downloading} className="py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <FileDown size={16} /> {downloading ? "Mengunduh..." : "Unduh PDF"}
            </button>
            {inv.status === "PAID" ? (
              <span className="py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Lunas</span>
            ) : inv.has_pending_payment ? (
              <span className="py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Hourglass size={16} /> Diverifikasi</span>
            ) : isOpen ? (
              <button onClick={() => onPay?.(inv)} className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Upload size={16} /> Konfirmasi Bayar</button>
            ) : <span />}
          </div>
        )}
      </div>
    </>
  );
}
