import { useEffect, useState } from "react";
import { ArrowRight, Paperclip } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import ApprovalFields from "@/components/admin/finance/ApprovalFields";
import { approvalReady } from "@/components/admin/finance/approval";
import { getAttendanceCorrections, approveAttendanceCorrection, rejectAttendanceCorrection } from "@/services/academic/attendanceService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

const STATUS = {
  PENDING: { label: "Menunggu persetujuan", className: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Ditolak", className: "bg-gray-100 text-gray-600" },
};

const RESULT_LABELS = {
  adjustment_invoice_no: (v) => `Tagihan penyesuaian ${v} diterbitkan`,
  credit_applied_to_invoice: (v) => `Kredit ${formatRupiah(v)} mengurangi sisa tagihan asli`,
  refund: (v) => `Dana ${formatRupiah(v.amount)} dikembalikan`,
  credit_balance: (v) => `Saldo kredit ${formatRupiah(v.amount)} untuk tagihan berikutnya`,
  payroll_adjustment: (v) => `${{ ADDITION: "Penambah", DEDUCTION: "Potongan", RECOVERY: "Permintaan pengembalian" }[v.kind]} honor ${formatRupiah(v.amount)}`,
  payroll_note: (v) => v,
};

/**
 * Koreksi absensi yang terkunci tagihan/payroll. Dampak keuangan ditampilkan sebelum disetujui;
 * tagihan & payroll yang sudah terbit tidak diubah, dampaknya dicatat sebagai data baru.
 */
export default function AttendanceCorrectionTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("single_operator");
  const [status, setStatus] = useState("PENDING");
  const [message, setMessage] = useState({ text: "", error: false });
  const [active, setActive] = useState(null);

  const load = async () => {
    try {
      const res = await getAttendanceCorrections(status ? { status } : {});
      setRows(res.data.data || []);
      setMode(res.data.approval_mode);
    } catch (err) {
      setMessage({ text: getApiErrorMessage(err, "Gagal memuat koreksi."), error: true });
    }
  };

  useEffect(() => { load(); }, [status]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Absensi yang sudah tertagih atau masuk payroll hanya bisa diubah lewat koreksi. Ajukan dari form absensi sesi, lalu setujui di sini.</p>
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {[["PENDING", "Menunggu"], ["APPROVED", "Disetujui"], ["REJECTED", "Ditolak"], ["", "Semua"]].map(([value, label]) => (
          <button key={label} onClick={() => setStatus(value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{label}</button>
        ))}
      </div>
      {message.text && <p className={`text-sm font-semibold ${message.error ? "text-rose-600" : "text-emerald-700"}`}>{message.text}</p>}

      {rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-400 border border-dashed rounded-2xl">Tidak ada koreksi.</p>
      ) : rows.map(c => (
        <div key={c.id} className="border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[220px]">
              <p className="font-bold text-gray-900">{c.student_name}</p>
              <p className="text-xs text-gray-500">{c.class_name} • {c.subject_name} • {c.session_date} {c.start_time}</p>
              <p className="text-sm font-bold mt-1 flex items-center gap-2">{c.old_status} <ArrowRight size={14} /> {c.new_status}</p>
              <p className="text-xs text-gray-600 mt-1">{c.reason}</p>
              {c.parent_request_note && <p className="text-xs text-gray-500">Permintaan orang tua: {c.parent_request_note}</p>}
              <p className="text-[11px] text-gray-400 mt-1">Diajukan {c.requested_by} • {c.requested_at} WIB{c.reviewed_by ? ` • diputuskan ${c.reviewed_by} ${c.reviewed_at} WIB` : ""}{c.self_approved ? " • disetujui sendiri" : ""}</p>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS[c.status]?.className}`}>{STATUS[c.status]?.label}</span>
          </div>

          <Effect effect={c.financial_effect} />

          {c.status === "PENDING" && (active?.id === c.id ? (
            <Decision correction={c} mode={mode} isSelf={c.requested_by_id === user?.id} onCancel={() => setActive(null)}
              onDone={(text) => { setActive(null); setMessage({ text, error: false }); load(); }} />
          ) : (
            <div className="flex justify-end">
              <button onClick={() => setActive(c)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">Tinjau & Putuskan</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Effect({ effect }) {
  if (!effect) return null;
  const { billing, payroll, results } = effect;
  return (
    <div className="grid sm:grid-cols-2 gap-2 text-xs">
      <div className="p-3 rounded-xl bg-slate-50">
        <p className="font-bold text-gray-700">Dampak tagihan</p>
        {!billing ? <p className="text-gray-400">Belum ada tagihan bulan ini.</p> : (
          <>
            <p>{billing.invoice_no}: <b className={billing.delta > 0 ? "text-rose-700" : billing.delta < 0 ? "text-emerald-700" : ""}>{billing.delta > 0 ? "kurang tagih " : billing.delta < 0 ? "lebih tagih " : ""}{formatRupiah(Math.abs(billing.delta))}</b></p>
            {billing.lines?.map(l => <p key={l.key} className="text-gray-500">{l.name}: {l.quantity} × {formatRupiah(l.unit_price)} (tarif tagihan)</p>)}
            {billing.delta < 0 && <p className="text-gray-500">Belum dibayar {formatRupiah(billing.unpaid_portion)} • sudah dibayar {formatRupiah(billing.paid_portion)}</p>}
          </>
        )}
      </div>
      <div className="p-3 rounded-xl bg-slate-50">
        <p className="font-bold text-gray-700">Dampak honor tentor</p>
        {!payroll ? <p className="text-gray-400">Sesi belum masuk payroll.</p> : (
          <p>{payroll.tentor_name} • {payroll.payroll_no} ({payroll.payroll_status}): <b>{formatRupiah(payroll.delta)}</b></p>
        )}
      </div>
      {results && Object.keys(results).length > 0 && (
        <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50 text-emerald-900">
          {Object.entries(results).map(([k, v]) => <p key={k}>• {RESULT_LABELS[k]?.(v) ?? k}</p>)}
        </div>
      )}
    </div>
  );
}

function Decision({ correction, mode, isSelf, onCancel, onDone }) {
  const billing = correction.financial_effect?.billing;
  const payroll = correction.financial_effect?.payroll;
  const needsBilling = billing && billing.paid_portion > 0;
  const needsPayroll = payroll && payroll.delta < 0 && payroll.payroll_status !== "DRAFT";
  const [form, setForm] = useState({ password: "", note: "", billing_resolution: "", refund_method: "TRANSFER", refund_reference_no: "", payroll_resolution: "" });
  const [proof, setProof] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ready = !saving && approvalReady({ mode, isSelf, password: form.password, note: form.note })
    && (!needsBilling || (form.billing_resolution && (form.billing_resolution !== "REFUND" || proof)))
    && (!needsPayroll || form.payroll_resolution);

  const run = async (action, text) => {
    setSaving(true);
    setError("");
    try {
      await action();
      onDone(text);
    } catch (err) {
      setError(getApiErrorMessage(err, "Keputusan gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const approve = () => run(() => {
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    if (proof) data.append("refund_proof", proof);
    return approveAttendanceCorrection(correction.id, data);
  }, "Koreksi disetujui dan dampak keuangannya dicatat.");

  const choice = (name, value, label) => (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input type="radio" name={`${name}-${correction.id}`} checked={form[name] === value} onChange={() => setForm({ ...form, [name]: value })} /> {label}
    </label>
  );

  return (
    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
      {needsBilling && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-700">Kelebihan tagih yang sudah dibayar ({formatRupiah(billing.paid_portion)}):</p>
          {choice("billing_resolution", "CREDIT", "Jadikan kredit untuk tagihan berikutnya")}
          {choice("billing_resolution", "REFUND", "Kembalikan dana ke orang tua")}
          {form.billing_resolution === "REFUND" && (
            <div className="grid sm:grid-cols-3 gap-2 pt-1">
              <select value={form.refund_method} onChange={e => setForm({ ...form, refund_method: e.target.value })} className="rounded-xl border px-2 py-2 text-xs"><option value="TRANSFER">Transfer</option><option value="CASH">Tunai</option></select>
              <input value={form.refund_reference_no} onChange={e => setForm({ ...form, refund_reference_no: e.target.value })} placeholder="No. referensi" className="rounded-xl border px-2 py-2 text-xs" />
              <label className="flex items-center gap-1 rounded-xl border border-dashed px-2 py-2 text-xs cursor-pointer bg-white"><Paperclip size={12} /><span className="truncate">{proof ? proof.name : "Bukti (wajib)"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setProof(e.target.files?.[0] || null)} className="hidden" /></label>
            </div>
          )}
        </div>
      )}
      {needsPayroll && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-700">Honor terlanjur dibayar lebih ({formatRupiah(Math.abs(payroll.delta))}):</p>
          {choice("payroll_resolution", "DEDUCT", "Potong dari honor bulan berikutnya")}
          {choice("payroll_resolution", "REFUND_REQUEST", "Minta tentor mengembalikan dana")}
        </div>
      )}
      <ApprovalFields
        mode={mode} isSelf={isSelf} password={form.password} note={form.note}
        onPassword={(v) => setForm({ ...form, password: v })} onNote={(v) => setForm({ ...form, note: v })}
        selfMessage="Anda juga mengajukan koreksi ini." separatedMessage="Koreksi harus disetujui akun yang berbeda dari pengaju."
      />
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 items-center">
        <input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Alasan bila ditolak" className="rounded-xl border px-3 py-2 text-xs flex-1 min-w-[160px]" />
        <button disabled={saving || rejectNote.trim().length < 5} onClick={() => run(() => rejectAttendanceCorrection(correction.id, rejectNote), "Koreksi ditolak; absensi tidak berubah.")} className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 border disabled:opacity-40">Tolak</button>
        <button onClick={onCancel} className="px-3 py-2 text-xs text-gray-500">Batal</button>
        <button disabled={!ready} onClick={approve} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white disabled:opacity-40">Setujui Koreksi</button>
      </div>
    </div>
  );
}
