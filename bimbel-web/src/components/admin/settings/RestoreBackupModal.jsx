import React, { useEffect, useState } from "react";
import { RotateCcw, X, Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { verifyBackup, restoreBackup } from "@/services/admin/backupService";
import { getApiErrorMessage } from "@/utils/apiError";

/**
 * Pemulihan dari backup: verifikasi arsip dulu, lalu password akun + ketik PULIHKAN.
 * onStarted dipanggil setelah server mengunci sistem dan pemulihan berjalan.
 */
export default function RestoreBackupModal({ backup, onClose, onStarted }) {
  const [verify, setVerify] = useState({ loading: false, data: null, error: "" });
  const [form, setForm] = useState({ password: "", confirmation: "", restore_files: true });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!backup) return;
    setForm({ password: "", confirmation: "", restore_files: backup.include_files });
    setError("");
    setVerify({ loading: true, data: null, error: "" });
    verifyBackup(backup.id)
      .then((res) => setVerify({ loading: false, data: res.data.data, error: "" }))
      .catch((err) => setVerify({ loading: false, data: null, error: getApiErrorMessage(err, "Verifikasi gagal.") }));
  }, [backup]);

  if (!backup) return null;

  const ready = verify.data && form.password && form.confirmation === "PULIHKAN" && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await restoreBackup(backup.id, form);
      onStarted({ backup_id: backup.id, filename: backup.filename });
    } catch (err) {
      setError(getApiErrorMessage(err, "Pemulihan tidak dapat dimulai."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-950 flex items-center gap-2"><RotateCcw size={18} className="text-amber-600" /> Pulihkan dari Backup</h3>
          <button onClick={onClose} disabled={submitting} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="text-sm">
            <p className="font-bold text-gray-900">{backup.filename}</p>
            <p className="text-xs text-gray-500">{backup.type_label} • {backup.started_at} WIB • {backup.size_label}</p>
          </div>

          {/* 1. Verifikasi */}
          <div className="border border-gray-200 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-black text-gray-500 uppercase">1. Verifikasi arsip</p>
            {verify.loading && <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Memeriksa arsip...</p>}
            {verify.error && <p className="text-xs text-red-600 font-bold flex items-start gap-1.5"><XCircle size={14} className="shrink-0 mt-0.5" /> {verify.error}</p>}
            {verify.data?.checks.map((c) => (
              <p key={c.label} className="text-xs text-gray-700 flex items-start gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><b>{c.label}</b> — {c.detail}</span>
              </p>
            ))}
          </div>

          {verify.data && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Seluruh data saat ini akan diganti dengan isi backup ini.</p>
                  <p>Data yang dibuat setelah {backup.started_at} WIB akan hilang dari sistem, tetapi tetap tersimpan di backup pengaman yang dibuat otomatis sebelum pemulihan. Selama proses, semua pengguna tidak dapat memakai aplikasi.</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black text-gray-500 uppercase">2. Konfirmasi</p>
                {backup.include_files ? (
                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={form.restore_files} onChange={(e) => setForm({ ...form, restore_files: e.target.checked })} className="w-4 h-4 mt-0.5 rounded" />
                    <span>Pulihkan juga berkas upload<span className="block text-xs text-gray-400">Bila tidak dicentang, hanya database yang dipulihkan.</span></span>
                  </label>
                ) : (
                  <p className="text-xs text-gray-500">Backup ini hanya berisi database; berkas upload saat ini tidak diubah.</p>
                )}
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-gray-600">Password akun Anda</span>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-gray-600">Ketik <b className="font-mono text-red-600">PULIHKAN</b> untuk melanjutkan</span>
                  <input value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono" />
                </label>
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Batal</button>
          <button onClick={submit} disabled={!ready} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Pulihkan Data
          </button>
        </div>
      </div>
    </div>
  );
}
