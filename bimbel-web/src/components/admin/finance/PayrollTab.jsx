import React, { useEffect, useState } from "react";
import { Settings2, RefreshCw, CheckCircle2, Trash2, Send, ChevronDown, ChevronUp, AlertTriangle, FileDown, Paperclip, ClipboardCheck, Wallet, Users } from "lucide-react";
import PremiumStatCard from "@/components/ui/StatCard";
import TutorPaymentModal from "./TutorPaymentModal";
import PayrollApproveModal from "./PayrollApproveModal";
import PayrollExceptionsPanel from "./PayrollExceptionsPanel";
import PayrollAdjustmentsPanel from "./PayrollAdjustmentsPanel";
import { downloadFile } from "@/utils/download";
import TentorRateModal from "./TentorRateModal";
import ConfirmationModal from "@/components/ui/confirmation/ConfirmationModal";
import {
  previewPayroll, generatePayroll, getPayroll, deletePayroll, getTransferProof, PAYROLL_STATUS, RECEIPT_STATUS,
} from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod } from "@/utils/format";

export default function PayrollTab({ period, onNotify }) {
  const [preview, setPreview] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [tentors, setTentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false });
  const [approveOpen, setApproveOpen] = useState(false);
  const [mode, setMode] = useState("single_operator");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    try {
      const res = await previewPayroll(period);
      setPreview(res.data.data);
      setMode(res.data.approval_mode);
      setRefreshKey(k => k + 1);
      const current = res.data.payroll?.data || res.data.payroll;
      setPayroll(current || null);
      if (current) {
        const detail = await getPayroll(current.id);
        setTentors(detail.data.tentors || []);
      } else {
        setTentors([]);
      }
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal memuat payroll."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [period]);

  const run = async (action, successMessage) => {
    setConfirm({ open: false });
    setBusy(true);
    try {
      const res = await action();
      onNotify(res?.data?.message || successMessage);
      await load();
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Aksi gagal."), "error");
    } finally {
      setBusy(false);
    }
  };

  const status = payroll ? PAYROLL_STATUS[payroll.status] : null;

  const downloadReport = async () => {
    try {
      await downloadFile("/admin/finance/reports/self-approvals", `Laporan-Persetujuan-Sendiri-${period}.pdf`, { period });
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal mengunduh laporan."), "error");
    }
  };

  const openProof = async (transfer) => {
    try {
      const res = await getTransferProof(payroll.id, transfer.id);
      window.open(URL.createObjectURL(res.data), "_blank", "noopener");
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Bukti transfer tidak dapat dibuka."), "error");
    }
  };
  const pendingCount = preview?.total_sessions || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-gray-900">Payroll {formatPeriod(period)}</h3>
          <p className="text-xs text-gray-500">Mencakup sesi HADIR & selesai bulan ini yang belum dibayar. Sesi dari bulan sebelumnya ditinjau dulu sebagai pengecualian.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadReport()} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5" title="Arsip aksi keuangan yang disetujui oleh akun yang juga mengerjakan tahap sebelumnya"><FileDown className="w-4 h-4" /> Laporan Persetujuan Sendiri</button>
          <button onClick={() => setRateOpen(true)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"><Settings2 className="w-4 h-4" /> Tarif Tentor</button>
          {(!payroll || payroll.status === "DRAFT") && (
            <button disabled={busy} onClick={() => run(() => generatePayroll(period), "Payroll disusun.")} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /> {payroll ? "Susun Ulang" : "Susun Payroll"}
            </button>
          )}
          {payroll?.status === "DRAFT" && (
            <>
              <button disabled={busy} onClick={() => setConfirm({ open: true, title: "Hapus Payroll Draft?", message: "Sesi akan dilepas dan bisa disusun ulang kapan saja.", variant: "danger", onConfirm: () => run(() => deletePayroll(payroll.id), "Payroll draft dihapus.") })} className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold"><Trash2 className="w-4 h-4" /></button>
              <button disabled={busy} onClick={() => setApproveOpen(true)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Setujui</button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-center text-sm text-gray-400">Memuat payroll...</p>
      ) : (
        <>
          {payroll ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <PremiumStatCard title="Status" value={status?.label} icon={ClipboardCheck} tone={payroll.status === "PAID" ? "emerald" : payroll.status === "APPROVED" ? "blue" : "amber"}
                desc={`${payroll.payroll_no} • disusun ${payroll.generated_by || "-"}${payroll.approved_by ? ` • disetujui ${payroll.approved_by}` : ""}${payroll.self_approved ? " (sendiri)" : ""}`} />
              <PremiumStatCard title="Total Honor" value={formatRupiah(payroll.total_amount)} desc={formatPeriod(period)} icon={Wallet} tone="indigo" />
              <PremiumStatCard title="Sesi / Tentor" value={`${payroll.total_sessions} / ${payroll.total_tutors}`} desc="Sesi dibayar / jumlah tentor" icon={Users} tone="purple" />
              <PremiumStatCard title="Sudah Ditransfer" value={`${payroll.paid_tutors ?? 0} / ${payroll.total_tutors}`} desc="Tentor yang sudah ditransfer" icon={Send} tone="green" />
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-gray-300 bg-slate-50 text-sm text-gray-600">
              Belum ada payroll untuk periode ini. Ada <strong>{pendingCount} sesi</strong> siap dihitung senilai <strong>{formatRupiah(preview?.total_amount)}</strong>.
            </div>
          )}

          {preview?.missing_rate?.length > 0 && (!payroll || payroll.status === "DRAFT") && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Ada sesi tanpa aturan honor dan tarif tentor Rp 0: <strong>{preview.missing_rate.join(", ")}</strong>. Buat aturan di tab Aturan Tarif atau atur <button onClick={() => setRateOpen(true)} className="underline font-bold">Tarif Tentor</button>, lalu susun ulang payroll.</span>
            </div>
          )}

          <PayrollExceptionsPanel refreshKey={refreshKey} onNotify={onNotify} onChanged={load} />
          <PayrollAdjustmentsPanel refreshKey={refreshKey} onNotify={onNotify} onChanged={load} />

          {payroll && payroll.status !== "DRAFT" && pendingCount > 0 && (
            <p className="text-xs text-gray-500">{pendingCount} sesi baru setelah payroll disetujui akan masuk payroll bulan berikutnya.</p>
          )}

          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {(payroll ? tentors : preview?.tentors || []).length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Belum ada sesi tentor yang perlu dibayar.</p>
            ) : (payroll ? tentors : preview.tentors).map(t => (
              <div key={t.tentor_id}>
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <button onClick={() => setExpanded(expanded === t.tentor_id ? null : t.tentor_id)} disabled={!payroll} className="flex-1 min-w-[200px] text-left flex items-center gap-2">
                    {payroll && (expanded === t.tentor_id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
                    <span>
                      <span className="block font-bold text-gray-900">{t.tentor_name}</span>
                      <span className="block text-xs text-gray-400">{t.total_sessions} sesi • {t.calc_summary || `${t.total_sessions} sesi × ${formatRupiah(t.rate_per_session)}`} • {Math.round((t.teaching_minutes || 0) / 60 * 10) / 10} jam mengajar</span>
                    </span>
                  </button>
                  <span className="text-lg font-black text-gray-900">{formatRupiah(t.total_amount)}</span>
                  {payroll?.status === "APPROVED" && !t.transfer && (
                    <button onClick={() => setPayTarget(t)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Transfer</button>
                  )}
                  {t.transfer && (
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold" title={`${t.transfer.source_account || ""} ${t.transfer.reference_no || ""}`}>Ditransfer {t.transfer.transfer_date}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${RECEIPT_STATUS[t.transfer.receipt_status]?.className || "bg-gray-100 text-gray-500"}`} title={t.transfer.receipt_note || ""}>{RECEIPT_STATUS[t.transfer.receipt_status]?.label || "Menunggu konfirmasi tentor"}</span>
                      {t.transfer.has_proof && <button onClick={() => openProof(t.transfer)} className="p-1 text-gray-400 hover:text-gray-700" title="Lihat bukti transfer"><Paperclip className="w-4 h-4" /></button>}
                    </span>
                  )}
                </div>
                {expanded === t.tentor_id && t.sessions && (
                  <div className="px-4 pb-4">
                    <table className="ui-table w-full text-xs bg-slate-50 rounded-xl overflow-hidden">
                      <thead><tr className="text-gray-400 uppercase"><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Kelas & Mapel</th><th className="p-2 text-left">Perhitungan</th><th className="p-2 text-right">Menit</th><th className="p-2 text-right">Honor</th></tr></thead>
                      <tbody className="divide-y divide-white">
                        {t.sessions.map((s, i) => (
                          <tr key={i}><td className="p-2">{s.session_date ? `${s.session_date} ${s.start_time}` : "Bulanan"}</td><td className="p-2">{s.class_name} • {s.subject_name}</td><td className="p-2 text-gray-500">{s.note || "-"}{s.quantity != null && s.unit_amount > 0 ? ` (${s.quantity} × ${formatRupiah(s.unit_amount)})` : ""}</td><td className="p-2 text-right">{s.teaching_minutes}</td><td className="p-2 text-right font-semibold">{formatRupiah(s.subtotal)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {approveOpen && payroll && (
        <PayrollApproveModal payroll={payroll} mode={mode} onClose={() => setApproveOpen(false)} onDone={(message) => { setApproveOpen(false); onNotify(message); load(); }} />
      )}
      <TutorPaymentModal
        open={!!payTarget}
        payroll={payroll}
        mode={mode}
        tentor={payTarget}
        onClose={() => setPayTarget(null)}
        onDone={(message) => { setPayTarget(null); onNotify(message); load(); }}
      />
      <TentorRateModal open={rateOpen} onClose={() => setRateOpen(false)} onSaved={load} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}
