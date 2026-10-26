import React, { useEffect, useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { getClasses } from "@/services/academic/classService";
import { generateInvoices } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatPeriod, formatRupiah } from "@/utils/format";

// Default jatuh tempo: tanggal 10 pada periode tagihan
const defaultDueDate = (period) => `${period}-10`;

export default function InvoiceGenerateModal({ open, period, onClose, onDone }) {
  const [form, setForm] = useState({ period, due_date: defaultDueDate(period) });
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ period, due_date: defaultDueDate(period) });
    setError("");
    getClasses({ perPage: 100, status_active: "true" })
      .then(res => {
        const list = (res.data?.data || []).filter(c => c.is_active !== false);
        setClasses(list);
        setSelected(list.filter(c => c.package_id).map(c => c.id));
      })
      .catch(() => setError("Gagal memuat data kelas."));
  }, [open, period]);

  if (!open) return null;

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) return setError("Pilih minimal satu kelas.");
    setSaving(true);
    setError("");
    try {
      const res = await generateInvoices({ ...form, class_ids: selected });
      onDone(res.data.message, form.period);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal membuat tagihan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarPlus className="w-6 h-6 text-blue-600" /> Generate Tagihan Bulanan</h2>
          <p className="text-sm text-gray-500">Setiap siswa di kelas terpilih mendapat tagihan sebesar harga paket kelasnya. Siswa yang sudah ditagih pada periode ini dilewati.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
              <input type="month" required value={form.period} onChange={e => setForm({ period: e.target.value, due_date: defaultDueDate(e.target.value) })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
              <input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Kelas ({selected.length} dipilih)</p>
            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {classes.length === 0 ? <p className="p-3 text-xs text-gray-400">Tidak ada kelas aktif.</p> : classes.map(c => (
                <label key={c.id} className={`flex items-center gap-3 p-3 text-sm ${c.package_id ? "cursor-pointer hover:bg-gray-50" : "opacity-50"}`}>
                  <input type="checkbox" disabled={!c.package_id} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
                  <span className="flex-1">
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="block text-xs text-gray-400">
                      {c.package_id ? `${c.package_name} • ${formatRupiah(c.package_price)} / bulan` : "Belum memiliki paket"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Membuat tagihan..." : `Buat Tagihan ${formatPeriod(form.period)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
