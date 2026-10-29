import { useEffect, useState } from "react";
import { X, Undo2, Eye, EyeOff } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { getReversals, approveReversal, rejectReversal, REVERSAL_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";
import TablePagination from "@/components/ui/table/TablePagination";

const MIN_NOTE = 10;

/**
 * Daftar reversal pembayaran dan keputusannya. Pada mode operator tunggal, persetujuan butuh password;
 * menyetujui pengajuan sendiri juga butuh alasan tertulis (dicatat sebagai self-approved).
 */
export default function ReversalPanel({ onNotify, onChanged }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [mode, setMode] = useState("single_operator");
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null); // { reversal, action: "approve" | "reject" }

  const load = async () => {
    try {
      const res = await getReversals({ status, page });
      setRows(res.data.data || []);
      setMeta(res.data.meta || { current_page: 1, last_page: 1 });
      setMode(res.data.approval_mode);
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal memuat reversal."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, page]);

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {[["PENDING", "Menunggu"], ["APPROVED", "Disetujui"], ["REJECTED", "Ditolak"], ["", "Semua"]].map(([value, label]) => (
          <button key={label} onClick={() => { setStatus(value); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{label}</button>
        ))}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="ui-table w-full text-left text-sm min-w-[760px]">
          <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            <tr><th className="p-4">Pembayaran</th><th className="p-4">Alasan</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Memuat reversal...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Tidak ada reversal.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/50 align-top">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{r.payment_no}</p>
                  <p className="text-xs text-gray-400">{r.student_name} • bayar {r.payment_date}</p>
                  <p className="text-xs text-gray-400">Diajukan {r.requested_by} • {r.requested_at} WIB</p>
                </td>
                <td className="p-4 text-xs text-gray-700 max-w-xs">
                  {r.reason}
                  {r.approval_note && <p className="mt-1 text-gray-500">Catatan persetujuan: {r.approval_note}</p>}
                  {r.reject_note && <p className="mt-1 text-gray-500">Alasan ditolak: {r.reject_note}</p>}
                </td>
                <td className="p-4 text-right font-bold">{formatRupiah(r.amount)}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${REVERSAL_STATUS[r.status]?.className}`}>{REVERSAL_STATUS[r.status]?.label}</span>
                  {r.self_approved && <p className="mt-1 text-[10px] font-bold text-amber-700">Disetujui pengaju sendiri</p>}
                  {(r.approved_by || r.rejected_by) && <p className="mt-1 text-[10px] text-gray-400">oleh {r.approved_by || r.rejected_by}</p>}
                </td>
                <td className="p-4 text-right whitespace-nowrap">
                  {r.status === "PENDING" && (
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setDecision({ reversal: r, action: "reject" })} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Tolak</button>
                      <button onClick={() => setDecision({ reversal: r, action: "approve" })} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700">Setujui</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        pagination={{ page: meta.current_page || 1, lastPage: meta.last_page || 1, perPage: 15, total: meta.total || 0, from: 0, to: 0 }}
        onPageChange={(target) => setPage(target)}
        label="reversal"
      />

      {decision && (
        <DecisionModal
          decision={decision}
          mode={mode}
          isOwnRequest={decision.reversal.requested_by_id === user?.id}
          onClose={() => setDecision(null)}
          onDone={(message) => { setDecision(null); onNotify(message); load(); onChanged?.(); }}
        />
      )}
    </div>
  );
}

function DecisionModal({ decision, mode, isOwnRequest, onClose, onDone }) {
  const { reversal, action } = decision;
  const approving = action === "approve";
  const singleOperator = mode !== "separated";
  const needsNote = approving ? singleOperator && isOwnRequest : true;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const blockedBySeparation = approving && !singleOperator && isOwnRequest;
  const ready = !saving && !blockedBySeparation
    && (!approving || !singleOperator || password)
    && (!needsNote || note.trim().length >= (approving ? MIN_NOTE : 5));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      if (approving) {
        await approveReversal(reversal.id, { password, note });
        onDone("Reversal disetujui. Tagihan terkait dihitung ulang dan orang tua diberi tahu.");
      } else {
        await rejectReversal(reversal.id, note);
        onDone("Reversal ditolak. Pembayaran tetap berlaku.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Keputusan gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">{reversal.payment_no} • {formatRupiah(reversal.amount)}</p>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Undo2 className="w-5 h-5" /> {approving ? "Setujui Reversal" : "Tolak Reversal"}</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <p className="text-gray-600"><b>Alasan pengajuan:</b> {reversal.reason}</p>
          {approving && (
            <p className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
              Pembayaran tidak dihapus, tetapi tidak lagi dihitung pada tagihan. Status tagihan akan dihitung ulang dan orang tua menerima notifikasi.
            </p>
          )}
          {blockedBySeparation && <p className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">Reversal ini harus disetujui akun lain karena Anda pengajunya.</p>}
          {approving && singleOperator && isOwnRequest && (
            <p className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">Anda juga pengaju reversal ini. Persetujuan akan dicatat sebagai <b>disetujui pengaju sendiri</b>.</p>
          )}

          {approving && singleOperator && (
            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-600">Password akun Anda</span>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
          )}
          {(needsNote || approving) && (
            <label className="block space-y-1">
              <span className="text-xs font-bold text-gray-600">
                {approving ? (needsNote ? `Alasan persetujuan (wajib, min. ${MIN_NOTE} karakter)` : "Catatan (opsional)") : "Alasan penolakan (wajib)"}
              </span>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </label>
          )}
          {error && <p className="font-medium text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 text-sm text-gray-500">Batal</button>
          <button onClick={submit} disabled={!ready} className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-40 ${approving ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-800 hover:bg-gray-900"}`}>
            {approving ? "Setujui Reversal" : "Tolak Reversal"}
          </button>
        </div>
      </div>
    </div>
  );
}
