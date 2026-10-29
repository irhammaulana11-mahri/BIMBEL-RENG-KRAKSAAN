import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import ApprovalFields from "./ApprovalFields";
import { approvalReady } from "./approval";
import { approvePayroll } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

/**
 * Persetujuan payroll DRAFT. Penyusun terakhir (generated_by) dibandingkan dengan akun yang menyetujui.
 */
export default function PayrollApproveModal({ payroll, mode, onClose, onDone }) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSelf = payroll.generated_by_id === user?.id;
  const ready = !saving && approvalReady({ mode, isSelf, password, note });

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await approvePayroll(payroll.id, { password, note });
      onDone("Payroll disetujui. Honor bisa ditransfer ke setiap tentor.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Payroll gagal disetujui."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">{payroll.payroll_no} • {formatRupiah(payroll.total_amount)}</p>
            <h2 className="text-lg font-bold text-gray-900">Setujui Payroll {payroll.period_label}</h2>
            <p className="text-xs text-gray-500">Disusun {payroll.generated_by || "-"} {payroll.generated_at ? `• ${payroll.generated_at} WIB` : ""}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <p className="text-gray-600">Setelah disetujui, payroll terkunci dan tidak bisa disusun ulang. Honor lalu ditransfer per tentor.</p>
          <ApprovalFields
            mode={mode} isSelf={isSelf} password={password} note={note} onPassword={setPassword} onNote={setNote}
            selfMessage="Anda juga menyusun payroll ini."
            separatedMessage="Payroll harus disetujui akun yang berbeda dari penyusunnya."
          />
          {error && <p className="font-medium text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-gray-500">Batal</button>
          <button onClick={submit} disabled={!ready} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> Setujui Payroll</button>
        </div>
      </div>
    </div>
  );
}
