import React, { useEffect, useState } from "react";
import { Mail, Phone, MapPin, GraduationCap, Briefcase, CalendarDays, KeyRound, Pencil, X, BookOpen, School, Wallet } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import { getTentorProfile, updateTentorProfile, updateTentorPassword } from "@/services/tentor/profileService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "T";

export default function TentorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { toast, showSuccess, hideToast } = useToast();

  const load = () => getTentorProfile()
    .then((res) => setProfile(res.data.data))
    .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat profil.")));

  useEffect(() => { load(); }, []);

  if (!profile) return <div className="p-12 text-center text-sm font-bold text-gray-400">{error || "Memuat profil..."}</div>;

  const info = [
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "No. WhatsApp", value: profile.phone },
    { icon: GraduationCap, label: "Pendidikan", value: profile.education },
    { icon: Briefcase, label: "Spesialisasi", value: profile.specialization },
    { icon: CalendarDays, label: "Bergabung", value: profile.joining_date },
    { icon: Wallet, label: "Tarif per Sesi", value: profile.rate_per_session > 0 ? formatRupiah(profile.rate_per_session) : "Belum diatur" },
  ];

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profil Tentor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informasi akun, mapel, dan kelas yang Anda ajar.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-2xl font-black">{initials(profile.name)}</div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{profile.name}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${profile.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{profile.is_active ? "Tentor Aktif" : "Nonaktif"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Pencil size={14} /> Ubah Kontak</button>
            <button onClick={() => setPasswordOpen(true)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50"><KeyRound size={14} /> Ganti Password</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400 font-semibold">{label}</p><p className="font-bold text-gray-800">{value || "-"}</p></div>
            </div>
          ))}
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div><p className="text-xs text-gray-400 font-semibold">Alamat</p><p className="font-bold text-gray-800">{profile.address || "-"}</p></div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400">Nama, email, data pribadi, dan tarif diubah oleh Admin bimbel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5"><BookOpen size={16} className="text-indigo-600" /> Mapel yang Dikuasai</p>
          {profile.subjects.length === 0 ? <p className="text-sm text-gray-400">Belum ada mapel terdaftar.</p> : (
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((s) => (
                <span key={s.id} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">{s.name}{s.level && <span className="font-medium text-indigo-500"> • {s.level}</span>}</span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5"><School size={16} className="text-indigo-600" /> Kelas yang Diajar</p>
          {profile.classes.length === 0 ? <p className="text-sm text-gray-400">Belum ada kelas.</p> : (
            <div className="space-y-2">
              {profile.classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-800">{c.name}</span>
                  <span className="text-xs text-gray-500">{c.class_type} • {c.students_count} siswa</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditContactModal open={editing} profile={profile} onClose={() => setEditing(false)} onDone={(m) => { setEditing(false); showSuccess(m); load(); }} />
      <ChangePasswordModal open={passwordOpen} submit={updateTentorPassword} onClose={() => setPasswordOpen(false)} onDone={(m) => { setPasswordOpen(false); showSuccess(m); }} />
    </div>
  );
}

function EditContactModal({ open, profile, onClose, onDone }) {
  const [form, setForm] = useState({ phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ phone: profile.phone || "", address: profile.address || "" });
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await updateTentorProfile(form);
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan profil."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-xl font-black text-gray-950">Ubah Kontak</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">No. WhatsApp</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Alamat</label>
            <textarea maxLength={500} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm min-h-[80px]" />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Menyimpan..." : "Simpan"}</button>
        </form>
      </div>
    </div>
  );
}
