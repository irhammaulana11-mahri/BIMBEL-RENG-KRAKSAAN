import React, { useEffect, useState } from "react";
import { Sparkles, Save, RefreshCw } from "lucide-react";
import { generateRecommendation, saveRecommendation } from "@/services/academic/progressReportService";
import { RECOMMENDATION_SECTIONS } from "@/components/report/RecommendationView";
import { getApiErrorMessage } from "@/utils/apiError";

// Daftar butir disunting sebagai teks satu butir per baris
const toForm = (rec) => ({
  summary: rec?.summary || "",
  developmental_note: rec?.developmental_note || "",
  ...Object.fromEntries(RECOMMENDATION_SECTIONS.map((s) => [s.key, (rec?.[s.key] || []).join("\n")])),
});
const toPayload = (form) => ({
  summary: form.summary,
  developmental_note: form.developmental_note,
  ...Object.fromEntries(RECOMMENDATION_SECTIONS.map((s) => [s.key, form[s.key].split("\n").map((l) => l.trim()).filter(Boolean)])),
});

/**
 * Rekomendasi perkembangan pada rapor DRAFT: buat dengan AI, lalu tinjau & sunting.
 * Ikut dibekukan dan tampil ke orang tua/siswa saat rapor diterbitkan.
 */
export default function RecommendationEditor({ target, period, value, aiEnabled, onChange }) {
  const [form, setForm] = useState(toForm(value));
  const [busy, setBusy] = useState(null); // "generate" | "save"
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setForm(toForm(value)); }, [value]);

  const params = { period, class_id: target.class_id, student_id: target.student_id };
  const changed = JSON.stringify(toPayload(form)) !== JSON.stringify(toPayload(toForm(value)));

  const run = async (kind) => {
    setBusy(kind);
    setError("");
    setMessage("");
    try {
      const res = kind === "generate"
        ? await generateRecommendation(params)
        : await saveRecommendation({ ...params, recommendation: toPayload(form) });
      onChange(res.data.data);
      setMessage(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, kind === "generate" ? "Gagal menyusun rekomendasi." : "Gagal menyimpan rekomendasi."));
    } finally {
      setBusy(null);
    }
  };

  const field = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400";

  return (
    <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Rekomendasi Perkembangan</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Disusun AI dari kehadiran, nilai ujian, dan catatan tentor dengan acuan ilmu tumbuh kembang & psikologi pendidikan. Nama anak tidak dikirim ke AI.</p>
        </div>
        <button
          onClick={() => run("generate")}
          disabled={!aiEnabled || busy}
          title={aiEnabled ? "" : "Isi ANTHROPIC_API_KEY di .env server untuk mengaktifkan"}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
        >
          {value ? <RefreshCw className={`w-4 h-4 ${busy === "generate" ? "animate-spin" : ""}`} /> : <Sparkles className="w-4 h-4" />}
          {busy === "generate" ? "Menyusun... (±1 menit)" : value ? "Buat Ulang dengan AI" : "Buat dengan AI"}
        </button>
      </div>

      {!aiEnabled && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">Fitur AI belum aktif (API key belum diisi). Rekomendasi tetap bisa ditulis manual di bawah.</p>}

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Ringkasan</label>
        <textarea rows={3} maxLength={2000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={field} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RECOMMENDATION_SECTIONS.map((s) => (
          <div key={s.key} className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase">{s.label} <span className="normal-case font-normal">(satu butir per baris)</span></label>
            <textarea rows={4} value={form[s.key]} onChange={(e) => setForm({ ...form, [s.key]: e.target.value })} className={field} />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan Tumbuh Kembang</label>
        <textarea rows={3} maxLength={2000} value={form.developmental_note} onChange={(e) => setForm({ ...form, developmental_note: e.target.value })} className={field} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => run("save")} disabled={!changed || busy} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
          <Save className="w-4 h-4" /> {busy === "save" ? "Menyimpan..." : "Simpan Rekomendasi"}
        </button>
        {message && <span className="text-xs font-semibold text-emerald-700">{message}</span>}
        {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
