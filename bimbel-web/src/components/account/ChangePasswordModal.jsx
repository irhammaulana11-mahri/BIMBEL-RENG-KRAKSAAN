import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getApiErrorMessage } from "@/utils/apiError";

const EMPTY = { current_password: "", password: "", password_confirmation: "" };
const inputClass = "w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm focus:outline-none focus:border-blue-500";
const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-wider";

/**
 * Ganti password akun sendiri. submit(form) -> promise axios dengan data.message.
 */
export default function ChangePasswordModal({ open, submit, onClose, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await submit(form);
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengganti password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b pb-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-gray-950 tracking-tight">Ganti Password</h3>
            <p className="text-xs text-gray-500 mt-0.5">Setelah diganti, login di perangkat lain akan dikeluarkan.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelClass}>Password Saat Ini</label><input type="password" required autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Password Baru</label><input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Ulangi Password Baru</label><input type="password" required minLength={8} autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className={inputClass} /></div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Menyimpan..." : "Ganti Password"}</button>
        </form>
      </div>
    </div>
  );
}
