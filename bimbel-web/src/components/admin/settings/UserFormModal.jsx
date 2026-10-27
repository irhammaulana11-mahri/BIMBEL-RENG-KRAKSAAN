import React, { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { getUserOptions } from "@/services/userService";
import { getApiErrorMessage } from "@/utils/apiError";

const inputClass = "w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm focus:outline-none focus:border-blue-500";
const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-wider";

/**
 * Tambah akun (staf / login siswa) atau ubah akun. onSubmit(form) melempar error agar tampil di modal.
 */
export default function UserFormModal({ open, user, onClose, onSubmit }) {
  const isEdit = Boolean(user);
  const [options, setOptions] = useState({ roles: [], students: [] });
  const [form, setForm] = useState({ role_id: "", name: "", email: "", phone: "", password: "", student_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(isEdit
      ? { role_id: user.role_id, name: user.name, email: user.email || "", phone: user.phone || "", password: "", student_id: "" }
      : { role_id: "", name: "", email: "", phone: "", password: "", student_id: "" });
    getUserOptions()
      .then((res) => {
        setOptions(res.data.data);
        if (!isEdit) setForm((f) => ({ ...f, role_id: res.data.data.roles[0]?.id || "" }));
      })
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat pilihan peran.")));
  }, [open, user]);

  if (!open) return null;

  const selectedRole = options.roles.find((r) => r.id === form.role_id);
  const isStudentAccount = !isEdit && selectedRole?.role_name === "siswa";
  // Saat ubah: peran hanya bisa diganti untuk akun staf
  const roleEditable = !isEdit || (user.is_staff && !user.is_self);
  const staffRoles = options.roles.filter((r) => r.role_name !== "siswa");

  const pickStudent = (id) => {
    const student = options.students.find((s) => s.id === id);
    setForm({ ...form, student_id: id, name: student ? student.name : form.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, phone: form.phone || null };
      if (isEdit) delete payload.password;
      if (!isStudentAccount) delete payload.student_id;
      await onSubmit(payload);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan akun."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b pb-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-gray-950 tracking-tight">{isEdit ? "Ubah Akun" : "Tambah Akun"}</h3>
            {isEdit && <p className="text-xs text-gray-500 mt-0.5">{user.role_label}{user.profile && ` • ${user.profile.name}`}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <p className="text-xs bg-blue-50 text-blue-800 border border-blue-100 rounded-xl px-3 py-2 flex gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              Akun tentor dibuat dari menu Tentor, akun orang tua dari konversi Lead. Di sini untuk staf Admin dan akun login siswa.
            </p>
          )}

          {(roleEditable && (isEdit ? staffRoles.length > 0 : options.roles.length > 0)) && (
            <div>
              <label className={labelClass}>Peran</label>
              <select required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value, student_id: "" })} className={`${inputClass} bg-white`}>
                {(isEdit ? staffRoles : options.roles).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          )}

          {isStudentAccount && (
            <div>
              <label className={labelClass}>Data Siswa</label>
              <select required value={form.student_id} onChange={(e) => pickStudent(e.target.value)} className={`${inputClass} bg-white`}>
                <option value="">-- Pilih siswa yang belum punya akun --</option>
                {options.students.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.nis}{s.level && ` • ${s.level}`}</option>)}
              </select>
              {options.students.length === 0 && <p className="text-xs text-amber-700 mt-1">Semua siswa sudah memiliki akun login.</p>}
            </div>
          )}

          <div><label className={labelClass}>Nama Tampilan</label><input required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Email (untuk login)</label><input type="email" required maxLength={100} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>No. HP (opsional)</label><input maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
          {!isEdit && (
            <div>
              <label className={labelClass}>Password Awal</label>
              <input type="text" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} font-mono`} />
              <p className="text-[11px] text-gray-400 mt-1">Minimal 8 karakter. Sampaikan ke pemilik akun dan minta diganti setelah login.</p>
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Akun"}</button>
        </form>
      </div>
    </div>
  );
}
