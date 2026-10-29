import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { MIN_APPROVAL_NOTE } from "./approval";

/**
 * Isian konfirmasi persetujuan keuangan (D-11): password akun + alasan bila menyetujui pekerjaan sendiri.
 * Server tetap memvalidasi; komponen ini hanya membantu pengguna.
 */
export default function ApprovalFields({ mode, isSelf, password, note, onPassword, onNote, selfMessage, separatedMessage }) {
  const [show, setShow] = useState(false);

  if (mode === "separated") {
    return isSelf ? <p className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">{separatedMessage}</p> : null;
  }

  return (
    <div className="space-y-3">
      {isSelf && (
        <p className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">{selfMessage} Langkah ini akan dicatat sebagai <b>disetujui sendiri</b> dan masuk laporan bulanan.</p>
      )}
      <label className="block space-y-1">
        <span className="text-xs font-bold text-gray-600">Password akun Anda</span>
        <div className="relative">
          <input type={show ? "text" : "password"} value={password} onChange={e => onPassword(e.target.value)} autoComplete="current-password" className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm" />
          <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-bold text-gray-600">{isSelf ? `Alasan (wajib, min. ${MIN_APPROVAL_NOTE} karakter)` : "Catatan (opsional)"}</span>
        <textarea rows={2} value={note} onChange={e => onNote(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
      </label>
    </div>
  );
}
