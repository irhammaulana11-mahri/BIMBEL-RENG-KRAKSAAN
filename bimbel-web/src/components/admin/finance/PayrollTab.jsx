import React, { useEffect, useState } from "react";
import { Settings2, RefreshCw, CheckCircle2, Trash2, Send, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import TutorPaymentModal from "./TutorPaymentModal";
import TentorRateModal from "./TentorRateModal";
import ConfirmationModal from "@/components/ui/confirmation/ConfirmationModal";
import {
  previewPayroll, generatePayroll, getPayroll, approvePayroll, deletePayroll, PAYROLL_STATUS,
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

  const load = async () => {
    try {
      const res = await previewPayroll(period);
      setPreview(res.data.data);
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
  const pendingCount = preview?.total_sessions || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-gray-900">Payroll {formatPeriod(period)}</h3>
          <p className="text-xs text-gray-500">Mencakup sesi HADIR & selesai yang belum dibayar sampai akhir bulan ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setRateOpen(true)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"><Settings2 className="w-4 h-4" /> Tarif Tentor</button>
          {(!payroll || payroll.status === "DRAFT") && (
            <button disabled={busy} onClick={() => run(() => generatePayroll(period), "Payroll disusun.")} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /> {payroll ? "Susun Ulang" : "Susun Payroll"}
            </button>
          )}
          {payroll?.status === "DRAFT" && (
            <>
              <button disabled={busy} onClick={() => setConfirm({ open: true, title: "Hapus Payroll Draft?", message: "Sesi akan dilepas dan bisa disusun ulang kapan saja.", variant: "danger", onConfirm: () => run(() => deletePayroll(payroll.id), "Payroll draft dihapus.") })} className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold"><Trash2 className="w-4 h-4" /></button>
              <button disabled={busy} onClick={() => setConfirm({ open: true, title: "Setujui Payroll?", message: "Setelah disetujui, payroll terkunci dan honor bisa ditransfer ke setiap tentor.", variant: "success", onConfirm: () => run(() => approvePayroll(payroll.id), "Payroll disetujui.") })} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Setujui</button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-center text-sm text-gray-400">Memuat payroll...</p>
      ) : (
        <>
          {payroll ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase">Status</p><span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${status?.className}`}>{status?.label}</span><p className="text-[10px] text-gray-400 mt-1">{payroll.payroll_no}</p></div>
              <div className="p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase">Total Honor</p><p className="text-xl font-black text-gray-900">{formatRupiah(payroll.total_amount)}</p></div>
              <div className="p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase">Sesi / Tentor</p><p className="text-xl font-black text-gray-900">{payroll.total_sessions} / {payroll.total_tutors}</p></div>
              <div className="p-4 rounded-2xl border border-gray-100"><p className="text-[10px] font-bold text-gray-400 uppercase">Sudah Ditransfer</p><p className="text-xl font-black text-emerald-700">{payroll.paid_tutors ?? 0} / {payroll.total_tutors}</p></div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-gray-300 bg-slate-50 text-sm text-gray-600">
              Belum ada payroll untuk periode ini. Ada <strong>{pendingCount} sesi</strong> siap dihitung senilai <strong>{formatRupiah(preview?.total_amount)}</strong>.
            </div>
          )}

          {preview?.missing_rate?.length > 0 && (!payroll || payroll.status === "DRAFT") && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Tarif belum diatur untuk: <strong>{preview.missing_rate.join(", ")}</strong>. Atur di <button onClick={() => setRateOpen(true)} className="underline font-bold">Tarif Tentor</button>, lalu susun ulang payroll.</span>
            </div>
          )}

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
                      <span className="block text-xs text-gray-400">{t.total_sessions} sesi × {formatRupiah(t.rate_per_session)} • {Math.round((t.teaching_minutes || 0) / 60 * 10) / 10} jam mengajar</span>
                    </span>
                  </button>
                  <span className="text-lg font-black text-gray-900">{formatRupiah(t.total_amount)}</span>
                  {payroll?.status === "APPROVED" && !t.transfer && (
                    <button onClick={() => setPayTarget(t)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Transfer</button>
                  )}
                  {t.transfer && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold" title={`${t.transfer.source_account || ""} ${t.transfer.reference_no || ""}`}>Ditransfer {t.transfer.transfer_date}</span>
                  )}
                </div>
                {expanded === t.tentor_id && t.sessions && (
                  <div className="px-4 pb-4">
                    <table className="w-full text-xs bg-slate-50 rounded-xl overflow-hidden">
                      <thead><tr className="text-gray-400 uppercase"><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Kelas & Mapel</th><th className="p-2 text-right">Menit</th><th className="p-2 text-right">Honor</th></tr></thead>
                      <tbody className="divide-y divide-white">
                        {t.sessions.map((s, i) => (
                          <tr key={i}><td className="p-2">{s.session_date} {s.start_time}</td><td className="p-2">{s.class_name} • {s.subject_name}</td><td className="p-2 text-right">{s.teaching_minutes}</td><td className="p-2 text-right font-semibold">{formatRupiah(s.subtotal)}</td></tr>
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

      <TutorPaymentModal
        open={!!payTarget}
        payrollId={payroll?.id}
        tentor={payTarget}
        onClose={() => setPayTarget(null)}
        onDone={(message) => { setPayTarget(null); onNotify(message); load(); }}
      />
      <TentorRateModal open={rateOpen} onClose={() => setRateOpen(false)} onSaved={load} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}
