import React, { useEffect, useState } from "react";
import { X, CalendarPlus, Eye, AlertTriangle } from "lucide-react";
import { getClasses } from "@/services/academic/classService";
import { generateInvoices, previewInvoices } from "@/services/finance/financeService";
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
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ period, due_date: defaultDueDate(period) });
    setError("");
    setPreview(null);
    getClasses({ perPage: 100, status_active: "true" })
      .then(res => {
        const list = (res.data?.data || []).filter(c => c.is_active !== false);
        setClasses(list);
        setSelected(list.map(c => c.id));
      })
      .catch(() => setError("Gagal memuat data kelas."));
  }, [open, period]);

  if (!open) return null;

  const toggle = (id) => {
    setPreview(null);
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Hitung dulu dari absensi + aturan tarif agar Admin memeriksa sebelum menerbitkan
  const handlePreview = async () => {
    if (selected.length === 0) return setError("Pilih minimal satu kelas.");
    setPreviewing(true);
    setError("");
    try {
      const res = await previewInvoices({ period: form.period, class_ids: selected });
      setPreview(res.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menghitung pratinjau."));
    } finally {
      setPreviewing(false);
    }
  };

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
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarPlus className="w-6 h-6 text-blue-600" /> Generate Tagihan Bulanan</h2>
          <p className="text-sm text-gray-500">Nominal dihitung dari absensi dan Aturan Tarif tagihan (tanpa aturan: harga paket per bulan). Periksa pratinjau sebelum menerbitkan. Siswa yang sudah ditagih pada periode ini dilewati.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
              <input type="month" required value={form.period} onChange={e => { setPreview(null); setForm({ period: e.target.value, due_date: defaultDueDate(e.target.value) }); }} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
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
                <label key={c.id} className="flex items-center gap-3 p-3 text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="rounded" />
                  <span className="flex-1">
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="block text-xs text-gray-400">
                      {c.class_type}{c.package_id ? ` • ${c.package_name} (${formatRupiah(c.package_price)} / bulan)` : " • tanpa paket"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {preview && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-gray-600 flex justify-between">
                <span>Pratinjau {formatPeriod(form.period)}</span>
                <span>Total tagihan baru {formatRupiah(preview.total_amount)}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {preview.rows.length === 0 && <p className="p-3 text-xs text-gray-400">Tidak ada siswa di kelas terpilih.</p>}
                {preview.rows.map(r => (
                  <div key={`${r.class_id}-${r.student_id}`} className={`p-3 text-xs ${r.already_billed ? "opacity-50" : ""}`}>
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-gray-800">{r.student_name} <span className="font-normal text-gray-400">• {r.class_name}</span></span>
                      <span className="font-black text-gray-900">{r.already_billed ? "Sudah ditagih" : formatRupiah(r.total)}</span>
                    </div>
                    {r.items.map((i, idx) => (
                      <p key={idx} className="text-gray-500 mt-0.5">{i.item_name}: {i.quantity} × {formatRupiah(i.unit_price)}{i.description ? ` — ${i.description}` : ""}</p>
                    ))}
                    {r.warning && <p className="text-amber-700 mt-0.5 flex items-center gap-1"><AlertTriangle size={11} /> {r.warning} (dilewati)</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={handlePreview} disabled={previewing} className="flex-1 px-4 py-3 border border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2">
              <Eye size={16} /> {previewing ? "Menghitung..." : preview ? "Hitung Ulang" : "Pratinjau"}
            </button>
            <button type="submit" disabled={saving || !preview} title={preview ? "" : "Lihat pratinjau terlebih dahulu"} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Membuat tagihan..." : `Terbitkan ${formatPeriod(form.period)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
