import React, { useEffect, useState } from "react";
import { Check, X, Phone, Mail } from "lucide-react";
import api from "@/api/axios";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { getStudentRegistrations, approveStudentRegistration, rejectStudentRegistration } from "@/services/academic/requestService";
import { REQUEST_STATUS } from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

const STATUS_TABS = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
];

export default function StudentRegistrationPage() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    try {
      const res = await getStudentRegistrations({ status });
      setItems(res.data.data || []);
      setPending(res.data.pending?.registration ?? 0);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat pendaftaran."));
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
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Pendaftaran Anak</h1>
          <p className="text-gray-500">Pendaftaran anak baru yang diajukan orang tua dari portal. Persetujuan membuat data siswa (NIS otomatis) dan bisa langsung menempatkan ke kelas.</p>
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
          <p className="text-center py-8 text-gray-400">Memuat pendaftaran...</p>
        ) : items.length === 0 ? (
          <div className="border border-gray-200 rounded-2xl p-8 text-center text-gray-400">Tidak ada pendaftaran.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-gray-900">{r.full_name}</p>
                      <p className="text-xs text-gray-500">{r.gender === "L" ? "Laki-laki" : r.gender === "P" ? "Perempuan" : "-"}{r.birth_date && ` • lahir ${r.birth_date}`}{r.school_name && ` • ${r.school_name}`}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
                  </div>
                  <p className="text-gray-700"><b>{r.education_level?.name || "-"}</b> • Paket {r.package ? `${r.package.name} (${formatRupiah(r.package.price)}/bln)` : "belum dipilih"}</p>
                  {r.note && <p className="text-xs text-gray-600 bg-slate-50 rounded-lg px-3 py-2">"{r.note}"</p>}
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                    <p className="font-bold text-gray-700">Orang tua: {r.parent?.name}</p>
                    <p className="flex flex-wrap gap-3 mt-0.5"><span className="flex items-center gap-1"><Phone size={12} /> {r.parent?.phone || "-"}</span><span className="flex items-center gap-1"><Mail size={12} /> {r.parent?.email || "-"}</span></p>
                  </div>
                  {r.status === "APPROVED" && <p className="text-xs text-emerald-700">Siswa {r.student?.nis}{r.class_name ? ` • kelas ${r.class_name}` : " • belum ditempatkan di kelas"}</p>}
                  {r.review_note && <p className="text-xs text-gray-500">Catatan: {r.review_note}</p>}
                  <p className="text-[11px] text-gray-400">Diajukan {r.created_at}{r.reviewed_at && ` • diproses ${r.reviewed_at} oleh ${r.reviewer_name}`}</p>
                </div>
                {r.status === "PENDING" && (
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setDecision({ item: r, mode: "reject" })} className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1"><X size={14} /> Tolak</button>
                    <button onClick={() => setDecision({ item: r, mode: "approve" })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"><Check size={14} /> Setujui</button>
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
  const [form, setForm] = useState({ full_name: "", school_name: "", class_id: "", review_note: "" });
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!decision) return;
    const r = decision.item;
    setForm({ full_name: r.full_name, school_name: r.school_name || "", class_id: "", review_note: "" });
    setError("");
    if (decision.mode === "approve") {
      api.get("/admin/classes", { params: { status_active: "true", perPage: 200 } })
        .then((res) => setClasses(res.data.data || []))
        .catch(() => setClasses([]));
    }
  }, [decision]);

  if (!decision) return null;
  const isApprove = decision.mode === "approve";
  const r = decision.item;
  // Kelas dengan paket yang sama diurutkan lebih dulu
  const sortedClasses = [...classes].sort((a, b) => (b.package_id === r.package?.id) - (a.package_id === r.package?.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = isApprove
        ? await approveStudentRegistration(r.id, { ...form, class_id: form.class_id || null })
        : await rejectStudentRegistration(r.id, form.review_note);
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memproses pendaftaran."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-black text-gray-950">{isApprove ? "Setujui Pendaftaran" : "Tolak Pendaftaran"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isApprove && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Nama Lengkap (koreksi bila perlu)</label>
                <input required maxLength={150} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Asal Sekolah</label>
                <input maxLength={150} value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Tempatkan ke Kelas (opsional)</label>
                <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm bg-white">
                  <option value="">Nanti saja (lewat menu Kelas)</option>
                  {sortedClasses.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.max_students && c.students_count >= c.max_students}>
                      {c.name} • {c.package_name || "-"} ({c.students_count}/{c.max_students || "∞"}){c.max_students && c.students_count >= c.max_students ? " — penuh" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">Akun login siswa (untuk ujian online) dapat dibuat kemudian di menu Siswa. Tagihan bulanan otomatis ikut saat Generate Tagihan bila siswa sudah di kelas.</p>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">{isApprove ? "Catatan untuk orang tua (opsional)" : "Alasan penolakan"}</label>
            <textarea required={!isApprove} maxLength={500} value={form.review_note} onChange={(e) => setForm({ ...form, review_note: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm min-h-[70px]" />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className={`w-full py-2.5 text-white font-bold text-sm rounded-xl disabled:opacity-50 ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
            {saving ? "Memproses..." : isApprove ? "Setujui & Buat Data Siswa" : "Tolak Pendaftaran"}
          </button>
        </form>
      </div>
    </div>
  );
}
