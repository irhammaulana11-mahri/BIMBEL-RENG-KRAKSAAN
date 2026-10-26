import React, { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { getClasses, getClassStudents } from "@/services/academic/classService";
import { createInvoice } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, todayDate } from "@/utils/format";

const ITEM_TYPES = [
  { value: "REGISTRATION", label: "Pendaftaran" },
  { value: "MODULE", label: "Modul / Buku" },
  { value: "PACKAGE", label: "Paket Belajar" },
  { value: "OTHER", label: "Lainnya" },
];

const emptyItem = () => ({ item_type: "REGISTRATION", item_name: "", quantity: 1, unit_price: "", discount: 0 });

/**
 * Tagihan manual: biaya pendaftaran, modul, atau tagihan lain di luar tagihan bulanan.
 */
export default function InvoiceFormModal({ open, onClose, onDone }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ class_id: "", student_id: "", due_date: todayDate(), discount: 0, note: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ class_id: "", student_id: "", due_date: todayDate(), discount: 0, note: "" });
    setItems([emptyItem()]);
    setStudents([]);
    setError("");
    getClasses({ perPage: 100 }).then(res => setClasses((res.data?.data || []).filter(c => c.package_id))).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!form.class_id) return setStudents([]);
    getClassStudents(form.class_id)
      .then(res => setStudents((res.data?.data || []).map(row => row.student).filter(Boolean)))
      .catch(() => setStudents([]));
  }, [form.class_id]);

  if (!open) return null;

  const updateItem = (index, field, value) => setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const lineTotal = (item) => Math.max(0, (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0));
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const total = Math.max(0, subtotal - (Number(form.discount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createInvoice({
        ...form,
        discount: Number(form.discount) || 0,
        items: items.map(item => ({ ...item, quantity: Number(item.quantity), unit_price: Number(item.unit_price), discount: Number(item.discount) || 0 })),
      });
      onDone("Tagihan manual berhasil dibuat.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal membuat tagihan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Tagihan Manual</h2>
          <p className="text-sm text-gray-500">Untuk biaya pendaftaran, modul, atau biaya lain di luar tagihan bulanan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <select required value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value, student_id: "" })} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
                <option value="">Pilih kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Siswa</label>
              <select required value={form.student_id} disabled={!form.class_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white disabled:bg-gray-50">
                <option value="">{form.class_id && students.length === 0 ? "Kelas belum ada siswa" : "Pilih siswa"}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
              <input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Rincian Biaya</p>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select value={item.item_type} onChange={e => updateItem(index, "item_type", e.target.value)} className="col-span-12 sm:col-span-2 rounded-lg border px-2 py-2 text-xs bg-white">
                  {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input required placeholder="Nama biaya" value={item.item_name} onChange={e => updateItem(index, "item_name", e.target.value)} className="col-span-12 sm:col-span-4 rounded-lg border px-2 py-2 text-sm" />
                <input type="number" min={1} required title="Jumlah" value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} className="col-span-3 sm:col-span-1 rounded-lg border px-2 py-2 text-sm" />
                <input type="number" min={0} required placeholder="Harga" value={item.unit_price} onChange={e => updateItem(index, "unit_price", e.target.value)} className="col-span-4 sm:col-span-2 rounded-lg border px-2 py-2 text-sm" />
                <input type="number" min={0} placeholder="Diskon" title="Diskon" value={item.discount} onChange={e => updateItem(index, "discount", e.target.value)} className="col-span-3 sm:col-span-2 rounded-lg border px-2 py-2 text-sm" />
                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} disabled={items.length === 1} className="col-span-2 sm:col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, emptyItem()])} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Tambah baris</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diskon Tagihan</label>
              <input type="number" min={0} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Opsional" />
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4">
            <span className="text-sm font-medium text-gray-600">Total Tagihan</span>
            <span className="text-xl font-black text-gray-900">{formatRupiah(total)}</span>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Buat Tagihan"}
          </button>
        </form>
      </div>
    </div>
  );
}
