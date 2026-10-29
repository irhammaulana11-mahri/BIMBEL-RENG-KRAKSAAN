import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import ApprovalFields from "./ApprovalFields";
import { approvalReady } from "./approval";
import { getPayrollExceptions, approvePayrollException, rejectPayrollException } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";

const STATUS = {
  OPEN: { label: "Perlu ditinjau", className: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
};

/**
 * Sesi HADIR dari periode lalu yang belum dibayar. Tidak masuk payroll otomatis: periksa hasil cek
 * (status, periode, absensi, duplikasi), lalu setujui agar ikut payroll berikutnya yang disusun, atau tolak.
 */
export default function PayrollExceptionsPanel({ refreshKey, onNotify, onChanged }) {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("single_operator");
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState(null); // { row, action }
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await getPayrollExceptions(showAll ? {} : { status: "OPEN" });
      setRows(res.data.data || []);
      setMode(res.data.approval_mode);
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal memuat pengecualian."), "error");
    }
  };

  useEffect(() => { load(); }, [refreshKey, showAll]);

  const open = (row, action) => { setActive({ row, action }); setPassword(""); setNote(""); };

  const submit = async () => {
    setSaving(true);
    try {
      if (active.action === "approve") {
        await approvePayrollException(active.row.id, { password, note });
        onNotify("Pengecualian disetujui. Sesi ikut saat payroll berikutnya disusun.");
      } else {
        await rejectPayrollException(active.row.id, note);
        onNotify("Pengecualian ditolak. Sesi tidak dibayar.");
      }
      setActive(null);
      await load();
      onChanged?.();
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Keputusan gagal disimpan."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (!showAll && rows.length === 0) {
    return <button onClick={() => setShowAll(true)} className="text-xs text-gray-400 hover:text-gray-600 underline">Lihat riwayat pengecualian sesi tertunda</button>;
  }

  const approving = active?.action === "approve";
  const ready = !saving && (approving ? approvalReady({ mode, isSelf: false, password, note }) : note.trim().length >= 5);

  return (
    <div className="border border-amber-200 bg-amber-50/40 rounded-2xl">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-amber-100">
        <p className="font-bold text-gray-900 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-amber-600" /> Sesi tertunda dari periode lalu</p>
        <button onClick={() => setShowAll(v => !v)} className="text-xs font-bold text-gray-500 hover:text-gray-800">{showAll ? "Hanya yang perlu ditinjau" : "Semua"}</button>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-gray-400">Tidak ada pengecualian.</p>
      ) : (
        <div className="divide-y divide-amber-100">
          {rows.map(r => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold text-gray-900">{r.tentor_name} • {r.session_date} {r.start_time}</p>
                  <p className="text-xs text-gray-500">{r.class_name} • {r.subject_name} • periode asli {r.origin_label}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS[r.status]?.className}`}>{STATUS[r.status]?.label}</span>
                {r.status === "OPEN" && (
                  <>
                    <button onClick={() => open(r, "reject")} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Tolak</button>
                    <button onClick={() => open(r, "approve")} disabled={!r.checks_passed} title={r.checks_passed ? "" : "Pemeriksaan belum lulus"} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Setujui</button>
                  </>
                )}
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                {r.checks.map(c => (
                  <li key={c.key} className={c.ok ? "text-gray-600" : "text-rose-700 font-semibold"}>{c.ok ? "✓" : "✗"} {c.label}: <span className="text-gray-500 font-normal">{c.detail}</span></li>
                ))}
              </ul>
              {r.status !== "OPEN" && (
                <p className="text-xs text-gray-500">Ditinjau {r.reviewed_by} • {r.reviewed_at} WIB{r.note ? ` • ${r.note}` : ""}{r.target_payroll ? ` • dibayar di ${r.target_payroll}` : ""}</p>
              )}
              {active?.row.id === r.id && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-3">
                  {approving ? (
                    <ApprovalFields mode={mode} isSelf={false} password={password} note={note} onPassword={setPassword} onNote={setNote} selfMessage="" separatedMessage="" />
                  ) : (
                    <textarea autoFocus rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Alasan penolakan (wajib)" className="w-full rounded-xl border px-3 py-2 text-sm" />
                  )}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setActive(null)} className="px-3 py-2 text-xs text-gray-500">Batal</button>
                    <button onClick={submit} disabled={!ready} className={`px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 ${approving ? "bg-emerald-600" : "bg-gray-800"}`}>{approving ? "Setujui" : "Tolak"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
