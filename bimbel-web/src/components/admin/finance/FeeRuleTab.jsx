import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Scale, Info } from "lucide-react";
import ConfirmationModal from "../../ui/confirmation/ConfirmationModal";
import { getFeeRules, createFeeRule, updateFeeRule, deleteFeeRule } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";

const TYPE_TABS = [
  { value: "BILLING", label: "Tagihan Wali", hint: "Menentukan nominal tagihan siswa per kelas per bulan." },
  { value: "PAYROLL", label: "Honor Tentor", hint: "Menentukan honor tentor dari sesi yang ia ajar (tentor harus absen hadir)." },
];

const STATUS_LABEL = { HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", ALPA: "Alpa" };

// Penjelasan rumus tiap metode agar Admin paham hasil hitungannya
const METHOD_HINT = {
  BILLING: {
    PER_MEETING: "Jumlah pertemuan selesai yang status siswanya dicentang × tarif.",
    PER_HOUR: "Total jam pertemuan yang status siswanya dicentang × tarif per jam.",
    MONTHLY: "Tarif tetap per siswa per bulan, tidak bergantung kehadiran.",
  },
  PAYROLL: {
    PER_STUDENT: "Per sesi: jumlah siswa berstatus dicentang × tarif.",
    PER_MEETING: "Per sesi: tarif, bila minimal satu siswa berstatus dicentang.",
    PER_HOUR: "Per sesi: jam mengajar aktual × tarif, bila minimal satu siswa berstatus dicentang.",
    MONTHLY: "Honor tetap per bulan bila tentor mengajar minimal satu sesi di cakupan ini.",
  },
};

const emptyForm = (type) => ({
  rule_type: type, name: "", class_type: "", package_id: "", education_level: "", tentor_id: "",
  method: type === "BILLING" ? "PER_MEETING" : "PER_STUDENT", amount: "",
  counted_statuses: ["HADIR"], effective_from: new Date().toISOString().slice(0, 10), effective_to: "",
  is_active: true, note: "",
});

const scopeText = (r) => [
  r.class_type, r.education_level, r.package_name && `Paket ${r.package_name}`, r.tentor_name && `Tentor ${r.tentor_name}`,
].filter(Boolean).join(" • ") || "Semua kelas";

export default function FeeRuleTab({ onNotify }) {
  const [type, setType] = useState("BILLING");
  const [rules, setRules] = useState([]);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | form object
  const [confirm, setConfirm] = useState({ open: false });

  const load = async () => {
    try {
      const res = await getFeeRules();
      setRules(res.data.data || []);
      setOptions(res.data.options);
    } catch (err) {
      onNotify?.(getApiErrorMessage(err, "Gagal memuat aturan tarif."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const list = rules.filter((r) => r.rule_type === type);
  const activeTab = TYPE_TABS.find((t) => t.value === type);

  const handleDelete = (rule) => setConfirm({
    open: true,
    title: "Hapus Aturan Tarif?",
    message: `Aturan "${rule.name}" akan dihapus. Tagihan/payroll yang sudah dibuat tidak berubah.`,
    variant: "danger",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        const res = await deleteFeeRule(rule.id);
        onNotify?.(res.data.message);
        load();
      } catch (err) {
        onNotify?.(getApiErrorMessage(err, "Gagal menghapus aturan."), "error");
      }
    },
  });

  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(list || []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {TYPE_TABS.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)} className={`px-4 py-2 rounded-lg text-sm font-bold ${type === t.value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing(emptyForm(type))} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Tambah Aturan
        </button>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-600 bg-slate-50 border border-gray-100 rounded-xl p-3">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <p>
          {activeTab.hint} Bila beberapa aturan cocok, dipakai yang <b>paling spesifik</b> (tentor &gt; paket &gt; jenjang &gt; jenis kelas), lalu yang paling baru berlaku.
          Tanpa aturan yang cocok, sistem memakai cara lama: {type === "BILLING" ? "harga paket kelas per bulan" : "tarif per sesi tentor (menu Tarif Tentor)"}.
        </p>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-gray-400">Memuat aturan...</p>
      ) : list.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">
          Belum ada aturan {activeTab.label.toLowerCase()}. Perhitungan memakai cara lama.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="ui-table w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">Aturan & Cakupan</th>
                <th className="p-3 text-left">Metode</th>
                <th className="p-3 text-right">Tarif</th>
                <th className="p-3 text-left">Status Dihitung</th>
                <th className="p-3 text-left">Berlaku</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((r) => (
                <tr key={r.id} className={r.is_active ? "" : "opacity-50"}>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{r.name} {!r.is_active && <span className="text-[10px] font-bold text-gray-500">(nonaktif)</span>}</p>
                    <p className="text-xs text-gray-500">{scopeText(r)}</p>
                  </td>
                  <td className="p-3 text-xs font-semibold text-gray-700">{r.method_label}</td>
                  <td className="p-3 text-right font-bold text-gray-900">{formatRupiah(r.amount)}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {r.method === "MONTHLY" ? "-" : (r.counted_statuses.length ? r.counted_statuses : options?.statuses || []).map((s) => STATUS_LABEL[s]).join(", ")}
                  </td>
                  <td className="p-3 text-xs text-gray-600">{r.effective_from}{r.effective_to ? ` s/d ${r.effective_to}` : " dst."}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing({ ...r, class_type: r.class_type || "", package_id: r.package_id || "", education_level: r.education_level || "", tentor_id: r.tentor_id || "", effective_to: r.effective_to || "", note: r.note || "" })} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(r)} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination pagination={pagination} onPageChange={onPageChange} label="data" />
    </div>
      )}

      {editing && options && (
        <FeeRuleModal
          form={editing}
          options={options}
          onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); onNotify?.(message); load(); }}
        />
      )}
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}

function FeeRuleModal({ form: initial, options, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isBilling = form.rule_type === "BILLING";
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleStatus = (status) => set({
    counted_statuses: form.counted_statuses.includes(status)
      ? form.counted_statuses.filter((s) => s !== status)
      : [...form.counted_statuses, status],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.method !== "MONTHLY" && form.counted_statuses.length === 0) return setError("Centang minimal satu status kehadiran yang dihitung.");
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const res = form.id ? await updateFeeRule(form.id, payload) : await createFeeRule(payload);
      onSaved(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan aturan."));
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white";
  const label = "text-[11px] font-bold text-gray-600 uppercase tracking-wider";
  const packages = options.packages.filter((p) => !form.class_type || p.class_type === form.class_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700"><X size={20} /></button>
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl"><Scale size={20} /></div>
          <div>
            <h2 className="text-xl font-black text-gray-950">{form.id ? "Ubah" : "Tambah"} Aturan {isBilling ? "Tagihan Wali" : "Honor Tentor"}</h2>
            <p className="text-xs text-gray-400">Perubahan hanya memengaruhi tagihan/payroll yang dibuat setelahnya.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Nama Aturan</label>
            <input required value={form.name} onChange={(e) => set({ name: e.target.value })} className={input} placeholder={isBilling ? "Contoh: Private per pertemuan" : "Contoh: Honor private per siswa"} />
          </div>

          <fieldset className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <legend className="px-1 text-xs font-black text-blue-600">CAKUPAN (kosongkan = semua)</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Jenis Kelas</label>
                <select value={form.class_type} onChange={(e) => set({ class_type: e.target.value, package_id: "" })} className={input}>
                  <option value="">Semua jenis</option>
                  {options.class_types.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Jenjang</label>
                <select value={form.education_level} onChange={(e) => set({ education_level: e.target.value })} className={input}>
                  <option value="">Semua jenjang</option>
                  {options.education_levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Paket</label>
                <select value={form.package_id} onChange={(e) => set({ package_id: e.target.value })} className={input}>
                  <option value="">Semua paket</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {!isBilling && (
                <div>
                  <label className={label}>Tentor</label>
                  <select value={form.tentor_id} onChange={(e) => set({ tentor_id: e.target.value })} className={input}>
                    <option value="">Semua tentor</option>
                    {options.tentors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Metode Perhitungan</label>
              <select value={form.method} onChange={(e) => set({ method: e.target.value })} className={input}>
                {options.methods[form.rule_type].map((m) => <option key={m} value={m}>{options.method_labels[m]}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Tarif (Rp){form.method === "PER_HOUR" ? " per jam" : form.method === "MONTHLY" ? " per bulan" : form.method === "PER_STUDENT" ? " per siswa" : " per pertemuan"}</label>
              <input type="number" min={0} step="any" required value={form.amount} onChange={(e) => set({ amount: e.target.value })} className={input} placeholder="50000" />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">{METHOD_HINT[form.rule_type][form.method]}</p>

          {form.method !== "MONTHLY" && (
            <div>
              <label className={label}>Status kehadiran siswa yang dihitung</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {options.statuses.map((s) => (
                  <label key={s} className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${form.counted_statuses.includes(s) ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                    <input type="checkbox" className="hidden" checked={form.counted_statuses.includes(s)} onChange={() => toggleStatus(s)} />
                    {STATUS_LABEL[s]}
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Contoh: centang Hadir + Alpa agar siswa yang alpa tetap {isBilling ? "ditagih" : "dihitung"} karena tentor sudah datang.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Berlaku Mulai</label>
              <input type="date" required value={form.effective_from} onChange={(e) => set({ effective_from: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Berlaku Sampai</label>
              <input type="date" value={form.effective_to} onChange={(e) => set({ effective_to: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={form.is_active ? "1" : "0"} onChange={(e) => set({ is_active: e.target.value === "1" })} className={input}>
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Catatan</label>
            <input value={form.note} onChange={(e) => set({ note: e.target.value })} className={input} placeholder="Opsional" />
          </div>

          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Aturan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
