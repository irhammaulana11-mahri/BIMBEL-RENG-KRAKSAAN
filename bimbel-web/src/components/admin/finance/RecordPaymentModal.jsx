import React, { useEffect, useState } from "react";
import { X, Banknote } from "lucide-react";
import { getInvoices, recordPayment } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, todayDate } from "@/utils/format";

/**
 * Admin mencatat pembayaran yang sudah diterima (tunai / transfer langsung).
 * Satu pembayaran bisa dialokasikan ke beberapa tagihan siswa yang sama.
 */
export default function RecordPaymentModal({ open, invoice, onClose, onDone }) {
  const [openInvoices, setOpenInvoices] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [form, setForm] = useState({ payment_method: "CASH", payment_date: todayDate(), payment_channel: "", reference_no: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !invoice) return;
    setError("");
    setForm({ payment_method: "CASH", payment_date: todayDate(), payment_channel: "", reference_no: "", note: "" });
    getInvoices({ student_id: invoice.student_id, status: "OPEN", per_page: 50 })
      .then(res => {
        const list = res.data?.data || [];
        setOpenInvoices(list);
        // Default: lunasi tagihan yang sedang dibuka
        setAmounts(Object.fromEntries(list.map(i => [i.id, i.id === invoice.id ? i.remaining_amount : ""])));
      })
      .catch(() => setError("Gagal memuat tagihan siswa."));
  }, [open, invoice]);

  if (!open || !invoice) return null;

  const allocations = openInvoices
    .filter(i => Number(amounts[i.id]) > 0)
    .map(i => ({ invoice_id: i.id, amount: Number(amounts[i.id]) }));
  const total = allocations.reduce((sum, a) => sum + a.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (allocations.length === 0) return setError("Isi nominal minimal untuk satu tagihan.");
    setSaving(true);
    setError("");
    try {
      await recordPayment({ ...form, student_id: invoice.student_id, allocations });
      onDone("Pembayaran berhasil dicatat.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mencatat pembayaran."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /> Catat Pembayaran</h2>
          <p className="text-sm text-gray-500">{invoice.student_name} • pembayaran langsung terkonfirmasi.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {openInvoices.map(i => (
              <div key={i.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{i.invoice_no}</p>
                  <p className="text-xs text-gray-400">Sisa {formatRupiah(i.remaining_amount)}</p>
                </div>
                <input
                  type="number" min={0} max={i.remaining_amount} value={amounts[i.id] ?? ""}
                  onChange={e => setAmounts({ ...amounts, [i.id]: e.target.value })}
                  className="w-36 rounded-lg border px-2 py-2 text-sm text-right" placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Metode</label>
              <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm bg-white">
                <option value="CASH">Tunai</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Bayar</label>
              <input type="date" required max={todayDate()} value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            {form.payment_method === "TRANSFER" && (
              <>
                <input placeholder="Bank / channel" value={form.payment_channel} onChange={e => setForm({ ...form, payment_channel: e.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
                <input placeholder="No. referensi" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
              </>
            )}
          </div>
          <input placeholder="Catatan (opsional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />

          <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-4">
            <span className="text-sm font-medium text-emerald-800">Total Diterima</span>
            <span className="text-xl font-black text-emerald-900">{formatRupiah(total)}</span>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Pembayaran"}
          </button>
        </form>
      </div>
    </div>
  );
}
