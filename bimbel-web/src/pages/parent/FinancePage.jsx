import React, { useEffect, useState } from "react";
import { Wallet, CheckCircle2, Paperclip, Hourglass } from "lucide-react";
import { getParentInvoices, getParentPayments, getParentPaymentProof, PAYMENT_STATUS } from "@/services/finance/financeService";
import { formatRupiah } from "@/utils/format";

export default function FinancePage() {
  const [summary, setSummary] = useState({ outstanding: 0 });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getParentInvoices(), getParentPayments()])
      .then(([inv, pay]) => {
        setSummary(inv.data.summary || {});
        setPayments(pay.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const confirmed = payments.filter(p => p.status === "CONFIRMED");
  const totalPaid = confirmed.reduce((sum, p) => sum + p.total_amount, 0);
  const pending = payments.filter(p => p.status === "PENDING").length;

  // Buka bukti transfer milik sendiri (lewat API ber-otorisasi)
  const openProof = async (paymentId) => {
    const tab = window.open("", "_blank");
    try {
      const res = await getParentPaymentProof(paymentId);
      tab.location.href = URL.createObjectURL(res.data);
    } catch {
      tab?.close();
    }
  };

  return (
    <div className="page-card space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Ikhtisar Transaksi & Keuangan</h1>
        <p className="text-gray-500 mt-1">Riwayat pembayaran bimbel anak Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Belum Dibayar</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{formatRupiah(summary.outstanding)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Total Dibayar</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalPaid)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Hourglass className="w-3.5 h-3.5" /> Menunggu Verifikasi</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-900">Riwayat Pembayaran</div>
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-400">Memuat riwayat...</p>
        ) : payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Belum ada pembayaran.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{p.payment_no} • {p.student_name}</p>
                  <p className="text-xs text-gray-400">
                    {p.payment_date} • {p.payment_method === "CASH" ? "Tunai di bimbel" : `Transfer ${p.payment_channel || ""}`} • {p.invoices?.map(i => i.invoice_no).join(", ")}
                  </p>
                  {p.status === "REJECTED" && p.reject_reason && <p className="text-xs text-rose-600 mt-0.5">Ditolak: {p.reject_reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {p.has_proof && (
                    <button onClick={() => openProof(p.id)} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> Bukti</button>
                  )}
                  <div className="text-right">
                    <p className="font-black text-gray-900">{formatRupiah(p.total_amount)}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PAYMENT_STATUS[p.status]?.className}`}>{PAYMENT_STATUS[p.status]?.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
