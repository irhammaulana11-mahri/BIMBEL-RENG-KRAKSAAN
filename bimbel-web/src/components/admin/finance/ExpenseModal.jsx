import React, { useEffect, useState } from "react";
import { X, Landmark } from "lucide-react";
import { getApiErrorMessage } from "@/utils/apiError";
import { todayDate } from "@/utils/format";

const emptyForm = () => ({ expense_date: todayDate(), category: "ATK_MODUL", title: "", amount: "", payment_method: "CASH", note: "" });

export default function ExpenseModal({ open, data, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setFormData(data ? {
      expense_date: data.expense_date,
      category: data.category,
      title: data.title,
      amount: data.amount,
      payment_method: data.payment_method,
      note: data.note || "",
    } : emptyForm());
  }, [open, data]);

  if (!open) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...formData, amount: Number(formData.amount) });
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan pengeluaran."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Landmark className="w-5 h-5 text-blue-600" /> {data ? "Edit Pengeluaran" : "Catat Kas Keluar"}</h2>
          <p className="text-sm text-gray-500">Biaya operasional di luar honor tentor.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
              <input type="date" required max={todayDate()} value={formData.expense_date} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm bg-white">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Keterangan</label>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Biaya listrik bulanan ruko" className="w-full rounded-xl border px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nominal (Rp)</label>
              <input type="number" min={1} required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dibayar dengan</label>
              <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm bg-white">
                <option value="CASH">Tunai</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
          </div>
          <textarea rows={2} value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Catatan (opsional)" className="w-full rounded-xl border px-3 py-2 text-sm" />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
