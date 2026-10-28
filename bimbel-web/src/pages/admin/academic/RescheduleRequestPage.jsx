import React, { useEffect, useState } from "react";
import { ArrowRight, Check, X, Users } from "lucide-react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { getRescheduleRequests, approveRescheduleRequest, rejectRescheduleRequest } from "@/services/academic/requestService";
import { REQUEST_STATUS, formatSessionDate } from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import PremiumStatCard from "../../../components/ui/StatCard";
import { Hourglass, CheckCircle2, XCircle, Users2 } from "lucide-react";

const STATUS_TABS = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
];

export default function RescheduleRequestPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null); // { item, mode: 'approve' | 'reject' }
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    try {
      const res = await getRescheduleRequests({ status });
      setItems(res.data.data || []);
      setPending(res.data.pending?.reschedule ?? 0);
      setStats(res.data.stats || {});
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat pengajuan."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); load(); }, [status]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Pengajuan Pindah Jadwal</h1>
          <p className="text-gray-500">Usulan pindah jadwal sesi dari orang tua dan tentor. Persetujuan memindahkan sesi untuk seluruh siswa kelas.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <PremiumStatCard title="Menunggu" value={stats.PENDING ?? 0} desc="Perlu keputusan Admin" icon={Hourglass} colorClass="text-amber-700" />
          <PremiumStatCard title="Disetujui" value={stats.APPROVED ?? 0} desc="Sesi sudah dipindahkan" icon={CheckCircle2} colorClass="text-green-700" />
          <PremiumStatCard title="Ditolak" value={stats.REJECTED ?? 0} desc="Disertai alasan penolakan" icon={XCircle} colorClass="text-red-700" />
          <PremiumStatCard title="Asal Pengajuan" value={`${stats.by_requester?.PARENT ?? 0} / ${stats.by_requester?.TENTOR ?? 0}`} desc={`Orang tua / Tentor • ${stats.CANCELLED ?? 0} dibatalkan`} icon={Users2} colorClass="text-indigo-700" />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {STATUS_TABS.map((t) => (
            <button key={t.value} onClick={() => setStatus(t.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${status === t.value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>
              {t.label}
              {t.value === "PENDING" && pending > 0 && <span className="px-1.5 rounded-full bg-rose-500 text-white text-[10px]">{pending}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400">Memuat pengajuan...</p>
        ) : items.length === 0 ? (
          <div className="border border-gray-200 rounded-2xl p-8 text-center text-gray-400">Tidak ada pengajuan.</div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.requester_type === "PARENT" ? "bg-purple-50 text-purple-700" : "bg-sky-50 text-sky-700"}`}>{r.requester_type === "PARENT" ? "Orang Tua" : "Tentor"}</span>
                    <p className="font-bold text-gray-900">{r.requester_name}{r.student_name && <span className="text-gray-500 font-medium"> (wali {r.student_name})</span>}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
                  </div>
                  <p className="font-semibold text-gray-700">
                    {r.session?.subject_name} • {r.session?.class_name} • {r.session?.tentor_name || "-"}
                    <span className="text-xs text-gray-400 inline-flex items-center gap-1 ml-2"><Users size={12} /> {r.session?.students_count ?? 0} siswa</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-gray-600">
                    <span>{formatSessionDate(r.original_date, { weekday: "short", day: "numeric", month: "short" })} {r.original_start_time}</span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <b className="text-gray-900">{formatSessionDate(r.proposed_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} {r.proposed_start_time}-{r.proposed_end_time}</b>
                  </p>
                  <p className="text-xs text-gray-500">Alasan: {r.reason}</p>
                  {/* Hasil cek bentrok terkini (tentor, kelas, siswa di kelas lain, ruang) */}
                  {r.status === "PENDING" && (r.conflicts?.length > 0 ? (
                    <div className="text-xs bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-2.5 py-1.5 space-y-0.5">
                      <p className="font-black">⚠️ Jam usulan bentrok</p>
                      {r.conflicts.map((c, i) => <p key={i}>• {c}</p>)}
                      <p className="text-rose-600/80">Klik Setujui lalu ganti tanggal/jam ke waktu yang kosong, atau Tolak dengan alasan.</p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-emerald-700">✓ Tidak bentrok dengan jadwal tentor, kelas, siswa, maupun ruang</p>
                  ))}
                  {r.review_note && <p className="text-xs text-gray-500">Catatan: {r.review_note}{r.reviewer_name && ` — ${r.reviewer_name}, ${r.reviewed_at}`}</p>}
                  <p className="text-[11px] text-gray-400">Diajukan {r.created_at}</p>
                </div>
                {r.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setDecision({ item: r, mode: "reject" })} className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1"><X size={14} /> Tolak</button>
                    <button onClick={() => setDecision({ item: r, mode: "approve" })} disabled={!r.can_approve} title={r.can_approve ? "" : "Sesi sudah berlangsung/selesai"} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-40"><Check size={14} /> Setujui</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DecisionModal decision={decision} onClose={() => setDecision(null)} onDone={(m) => { setDecision(null); showSuccess(m); load(); }} />
    </div>
  );
}

function DecisionModal({ decision, onClose, onDone }) {
  const [form, setForm] = useState({ session_date: "", start_time: "", end_time: "", review_note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!decision) return;
    const r = decision.item;
    setForm({ session_date: r.proposed_date, start_time: r.proposed_start_time, end_time: r.proposed_end_time, review_note: "" });
    setError("");
  }, [decision]);

  if (!decision) return null;
  const isApprove = decision.mode === "approve";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = isApprove
        ? await approveRescheduleRequest(decision.item.id, form)
        : await rejectRescheduleRequest(decision.item.id, form.review_note);
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memproses pengajuan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-black text-gray-950">{isApprove ? "Setujui & Pindahkan Sesi" : "Tolak Pengajuan"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isApprove && (
            <>
              <p className="text-xs text-gray-500">Jadwal di bawah sudah terisi sesuai usulan. Ubah bila perlu; sistem memeriksa bentrok jadwal tentor dan siswa.</p>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Tanggal</label>
                <input type="date" required value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Mulai</label>
                  <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Selesai</label>
                  <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-mono" />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">{isApprove ? "Catatan untuk pengaju (opsional)" : "Alasan penolakan"}</label>
            <textarea required={!isApprove} maxLength={500} value={form.review_note} onChange={(e) => setForm({ ...form, review_note: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm min-h-[70px]" />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className={`w-full py-2.5 text-white font-bold text-sm rounded-xl disabled:opacity-50 ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
            {saving ? "Memproses..." : isApprove ? "Setujui & Pindahkan" : "Tolak Pengajuan"}
          </button>
        </form>
      </div>
    </div>
  );
}
