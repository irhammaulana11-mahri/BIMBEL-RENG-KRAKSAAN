import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, KeyRound, Power, Trash2, Copy, X, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import UserFormModal from "../../../components/admin/settings/UserFormModal";
import { getUsers, createUser, updateUser, toggleUserStatus, resetUserPassword, deleteUser, ROLE_BADGE } from "@/services/admin/userService";
import { getApiErrorMessage } from "@/utils/apiError";

const PROFILE_LABEL = { tentor: "Profil tentor", orang_tua: "Profil orang tua", siswa: "Siswa" };

export default function UserPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({ keyword: "", role: "", status: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, user: null });
  const [credential, setCredential] = useState(null);
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    try {
      const res = await getUsers({ ...filters, per_page: 15 });
      setRows(res.data.data || []);
      setMeta(res.data.meta);
      setSummary(res.data.summary || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat daftar akun."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  // Dipanggil modal; error dilempar kembali agar tampil di modal
  const handleSubmit = async (form) => {
    const res = modal.user ? await updateUser(modal.user.id, form) : await createUser(form);
    setModal({ open: false, user: null });
    showSuccess(res.data.message);
    load();
  };

  const runAction = async (action, fallback) => {
    try {
      const res = await action();
      showSuccess(res.data.message);
      load();
      return res;
    } catch (err) {
      showError(getApiErrorMessage(err, fallback));
      return null;
    }
  };

  const handleToggle = async (user) => {
    const ok = await confirm.confirm({
      title: user.is_active ? "Nonaktifkan Akun?" : "Aktifkan Akun?",
      message: user.is_active ? `${user.name} tidak bisa login dan langsung dikeluarkan dari semua perangkat.` : `${user.name} dapat login kembali.`,
      confirmText: user.is_active ? "Ya, Nonaktifkan" : "Ya, Aktifkan",
      variant: user.is_active ? "danger" : "success",
    });
    if (ok) runAction(() => toggleUserStatus(user.id), "Gagal mengubah status akun.");
  };

  const handleReset = async (user) => {
    const ok = await confirm.confirm({
      title: "Reset Password?",
      message: `Password ${user.name} akan diganti password sementara dan semua sesi login dikeluarkan.`,
      confirmText: "Ya, Reset",
      variant: "warning",
    });
    if (!ok) return;
    const res = await runAction(() => resetUserPassword(user.id), "Gagal mereset password.");
    if (res) setCredential({ name: user.name, email: user.email, password: res.data.temporary_password });
  };

  const handleDelete = async (user) => {
    const ok = await confirm.delete({
      title: "Hapus Akun?",
      message: user.profile?.type === "siswa"
        ? `Akun login ${user.name} dihapus. Data siswa tetap ada dan bisa diberi akun baru.`
        : `Akun ${user.name} dihapus permanen.`,
    });
    if (ok) runAction(() => deleteUser(user.id), "Gagal menghapus akun.");
  };

  const copyCredential = async () => {
    try {
      await navigator.clipboard.writeText(`Login Bimbel Reng Kraksaan\nEmail: ${credential.email}\nPassword: ${credential.password}`);
      showSuccess("Kredensial disalin.");
    } catch {
      showError("Gagal menyalin. Salin manual dari layar.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Akun</h1>
            <p className="text-gray-500">Akun login seluruh pengguna: aktif/nonaktif, reset password, staf Admin, dan akun login siswa.</p>
          </div>
          <button onClick={() => setModal({ open: true, user: null })} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shrink-0">
            <Plus className="w-4 h-4" /> Tambah Akun
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter({ role: "" })} className={`px-3 py-2 rounded-xl text-xs font-bold border ${filters.role === "" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600 border-gray-200"}`}>
            Semua ({summary.reduce((sum, s) => sum + s.total, 0)})
          </button>
          {summary.map((s) => (
            <button key={s.role} onClick={() => setFilter({ role: s.role })} className={`px-3 py-2 rounded-xl text-xs font-bold border ${filters.role === s.role ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600 border-gray-200"}`}>
              {s.label} ({s.total}){s.inactive > 0 && <span className="text-rose-400"> • {s.inactive} nonaktif</span>}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/40">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filters.keyword} onChange={(e) => setFilter({ keyword: e.target.value })} placeholder="Cari nama, email, atau no. HP..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-white" />
            </div>
            <select value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[820px]">
              <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr><th className="p-4">Nama / Email</th><th className="p-4">Peran</th><th className="p-4">Terhubung ke</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Memuat akun...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Tidak ada akun pada filter ini.</td></tr>
                ) : rows.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">{u.name}{u.is_self && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">Anda</span>}</p>
                      <p className="text-xs text-gray-500">{u.email || "-"}{u.phone && ` • ${u.phone}`}</p>
                    </td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${ROLE_BADGE[u.role_name] || "bg-gray-100 text-gray-600"}`}>{u.is_staff && <Shield size={12} />}{u.role_label}</span></td>
                    <td className="p-4 text-xs text-gray-600">
                      {u.profile ? <><p className="font-semibold text-gray-800">{u.profile.name}</p><p className="text-gray-400">{PROFILE_LABEL[u.profile.type]}{u.profile.detail && ` • ${u.profile.detail}`}</p></> : <span className="text-gray-400">{u.is_staff ? "Staf" : "-"}</span>}
                    </td>
                    <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{u.is_active ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setModal({ open: true, user: u })} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Ubah"><Pencil className="w-4 h-4" /></button>
                        {!u.is_self && (
                          <>
                            <button onClick={() => handleReset(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Reset password"><KeyRound className="w-4 h-4" /></button>
                            <button onClick={() => handleToggle(u)} className={`p-2 rounded-lg ${u.is_active ? "text-gray-500 hover:bg-gray-100" : "text-emerald-600 hover:bg-emerald-50"}`} title={u.is_active ? "Nonaktifkan" : "Aktifkan"}><Power className="w-4 h-4" /></button>
                            {!["tentor", "orang_tua"].includes(u.profile?.type) && (
                              <button onClick={() => handleDelete(u)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 text-xs text-gray-500">
              <span>Halaman {meta.current_page} dari {meta.last_page} • {meta.total} akun</span>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserFormModal open={modal.open} user={modal.user} onClose={() => setModal({ open: false, user: null })} onSubmit={handleSubmit} />

      {credential && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-950 flex items-center gap-2"><KeyRound size={18} className="text-blue-600" /> Password Sementara</h3>
              <button onClick={() => setCredential(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600">{credential.name}</p>
            <div className="bg-slate-50 border rounded-xl p-3 text-sm space-y-1">
              <p>Email: <b>{credential.email}</b></p>
              <p>Password: <b className="font-mono">{credential.password}</b></p>
            </div>
            <p className="text-[11px] text-gray-500">Password hanya tampil sekali. Minta pemilik akun menggantinya setelah login.</p>
            <div className="flex gap-2">
              <button onClick={copyCredential} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"><Copy size={14} /> Salin</button>
              <button onClick={() => setCredential(null)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
