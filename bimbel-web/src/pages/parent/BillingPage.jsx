import React, { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Upload, AlertTriangle, X, Hourglass, Eye, FileDown, Wallet, Receipt } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { getParentInvoices, submitParentPayment, INVOICE_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod, todayDate } from "@/utils/format";
import PremiumStatCard from "../../components/ui/StatCard";
import InvoiceDrawer from "../../components/parent/InvoiceDrawer";
import { downloadFile } from "@/utils/download";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export default function ParentBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ outstanding: 0, open_count: 0, overdue_count: 0 });
  const [children, setChildren] = useState([]);
  const [childFilter, setChildFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const downloadPdf = async (inv) => {
    setDownloading(inv.id);
    try {
      await downloadFile(`/parent/invoices/${inv.id}/pdf`, `Invoice-${inv.invoice_no}.pdf`);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal mengunduh invoice."));
    } finally {
      setDownloading(null);
    }
  };
  const { toast, showSuccess, showError, hideToast } = useToast();

  const loadInvoices = async () => {
    try {
      const res = await getParentInvoices({ student_id: childFilter });
      setInvoices(res.data.data || []);
      setSummary(res.data.summary || {});
      setChildren(res.data.children || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal mengambil tagihan."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, [childFilter]);

  const lastPayment = (inv) => inv.payments?.[0];

  return (
    <div className="page-card space-y-6 animate-in fade-in duration-300">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Tagihan & Pembayaran</h1>
          <p className="text-gray-500 mt-1">Lihat tagihan bimbel anak dan kirim bukti transfer untuk diverifikasi Admin.</p>
        </div>
        {children.length > 1 && (
          <select value={childFilter} onChange={e => setChildFilter(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
            <option value="">Semua anak</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PremiumStatCard title="Total Belum Dibayar" value={formatRupiah(summary.outstanding)} desc="Sisa seluruh tagihan aktif" icon={Wallet} colorClass="text-red-700" />
        <PremiumStatCard title="Tagihan Aktif" value={summary.open_count ?? 0} desc="Belum lunas / dibayar sebagian" icon={Receipt} colorClass="text-blue-700" />
        <PremiumStatCard title="Lewat Jatuh Tempo" value={summary.overdue_count ?? 0} desc={summary.overdue_count > 0 ? "Segera lakukan pembayaran" : "Tidak ada tunggakan"} icon={AlertTriangle} colorClass={summary.overdue_count > 0 ? "text-amber-700" : "text-green-700"} />
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-gray-400">Memuat tagihan...</p>
      ) : invoices.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-sm text-gray-400">Belum ada tagihan.</div>
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => {
            const isOpen = ["UNPAID", "PARTIAL"].includes(inv.status);
            const last = lastPayment(inv);
            return (
              <div key={inv.id} className={`bg-white rounded-2xl border p-5 shadow-xs ${inv.is_overdue ? "border-rose-200" : "border-gray-100"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${inv.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                      {inv.status === "PAID" ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">{inv.invoice_no}{inv.invoice_type === "ADJUSTMENT" ? " • Penyesuaian" : ""}</p>
                      <p className="font-bold text-gray-900">
                        {inv.period_month ? `SPP ${formatPeriod(`${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`)}` : "Tagihan Lainnya"} • {inv.student_name}
                      </p>
                      <p className="text-xs text-gray-500">{inv.class_name} • {inv.package_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">{formatRupiah(isOpen ? inv.remaining_amount : inv.total_amount)}</p>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${INVOICE_STATUS[inv.status]?.className}`}>{INVOICE_STATUS[inv.status]?.label}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-3">
                  <p className={`text-xs font-semibold flex items-center gap-1 ${inv.is_overdue ? "text-rose-600" : "text-gray-500"}`}>
                    {inv.is_overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    Jatuh tempo {inv.due_date}{inv.status === "PARTIAL" && ` • terbayar ${formatRupiah(inv.paid_amount)} dari ${formatRupiah(inv.total_amount)}`}
                  </p>

                  {last?.status === "REJECTED" && isOpen && !inv.has_pending_payment && (
                    <p className="text-xs text-rose-600 w-full sm:w-auto">Bukti terakhir ditolak: {last.reject_reason}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setDetailId(inv.id)} className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5"><Eye className="w-4 h-4" /> Detail</button>
                  <button onClick={() => downloadPdf(inv)} disabled={downloading === inv.id} className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"><FileDown className="w-4 h-4" /> {downloading === inv.id ? "Mengunduh..." : "PDF"}</button>
                  {inv.has_pending_payment ? (
                    <span className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5"><Hourglass className="w-4 h-4" /> Bukti sedang diverifikasi</span>
                  ) : isOpen && (
                    <button onClick={() => setPaying(inv)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> Konfirmasi Pembayaran
                    </button>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InvoiceDrawer invoiceId={detailId} onClose={() => setDetailId(null)} onPay={(inv) => { setDetailId(null); setPaying(inv); }} />
      <PaymentProofModal
        invoice={paying}
        onClose={() => setPaying(null)}
        onDone={(message) => { setPaying(null); showSuccess(message); loadInvoices(); }}
      />
    </div>
  );
}

function PaymentProofModal({ invoice, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", payment_date: todayDate(), payment_channel: "", reference_no: "", note: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoice) return;
    setForm({ amount: invoice.remaining_amount, payment_date: todayDate(), payment_channel: "", reference_no: "", note: "" });
    setFile(null);
    setError("");
  }, [invoice]);

  if (!invoice) return null;

  const handleFile = (e) => {
    const selected = e.target.files[0];
    setError("");
    if (selected && selected.size > MAX_PROOF_SIZE) {
      setFile(null);
      setError("Ukuran bukti transfer maksimal 5 MB.");
      return;
    }
    setFile(selected || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Unggah foto / PDF bukti transfer.");
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ""));
    data.append("proof", file);

    setSaving(true);
    setError("");
    try {
      const res = await submitParentPayment(invoice.id, data);
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim bukti pembayaran."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold text-gray-900">Konfirmasi Pembayaran</h2>
        <p className="text-sm text-gray-500 mb-5">{invoice.invoice_no} • sisa {formatRupiah(invoice.remaining_amount)}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nominal Transfer</label>
              <input type="number" min={1} max={invoice.remaining_amount} required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Transfer</label>
              <input type="date" required max={todayDate()} value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
          </div>
          <input required placeholder="Bank / e-wallet pengirim (mis. BCA, DANA)" value={form.payment_channel} onChange={e => setForm({ ...form, payment_channel: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="No. referensi (opsional)" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
          <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300">
            <Upload className="w-5 h-5 mx-auto text-gray-400" />
            <span className="block text-sm font-semibold text-gray-700 mt-1">{file ? file.name : "Pilih foto / PDF bukti transfer"}</span>
            <span className="block text-[11px] text-gray-400">JPG, PNG, WEBP, atau PDF • maks 5 MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFile} className="hidden" />
          </label>
          <textarea rows={2} placeholder="Catatan untuk Admin (opsional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Mengirim..." : "Kirim Bukti Pembayaran"}
          </button>
        </form>
      </div>
    </div>
  );
}
