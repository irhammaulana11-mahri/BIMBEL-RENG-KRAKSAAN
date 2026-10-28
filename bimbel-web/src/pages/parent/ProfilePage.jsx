import React, { useEffect, useState } from "react";
import LocationPicker from "../../components/ui/LocationPicker";
import { User, GraduationCap, Phone, Mail, Plus, Package, MapPin, Briefcase, KeyRound, Pencil, X, School } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmationModal from "../../components/ui/confirmation/ConfirmationModal";
import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import {
  getParentProfile, updateParentProfile, updateParentPassword,
  getRegistrationOptions, getParentRegistrations, submitParentRegistration, cancelParentRegistration,
  REQUEST_STATUS,
} from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

export default function ParentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    try {
      const [prof, regs] = await Promise.all([getParentProfile(), getParentRegistrations()]);
      setProfile(prof.data.data);
      setRegistrations(regs.data.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat profil."));
    }
  };

  useEffect(() => { load(); }, []);

  const done = (message) => { showSuccess(message); load(); };

  const handleCancel = (reg) => setConfirm({
    open: true,
    title: "Batalkan Pendaftaran?",
    message: `Pendaftaran ${reg.full_name} akan dibatalkan.`,
    variant: "warning",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        const res = await cancelParentRegistration(reg.id);
        done(res.data.message);
      } catch (err) {
        showError(getApiErrorMessage(err, "Gagal membatalkan pendaftaran."));
      }
    },
  });

  if (!profile) return <div className="p-12 text-center text-sm font-bold text-gray-400">Memuat profil...</div>;

  return (
    <div className="page-card space-y-6 animate-in fade-in duration-300">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Profil & Anak Didik</h1>
        <p className="text-base text-gray-500 mt-1">Kelola data kontak Anda, keamanan akun, dan pendaftaran anak.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Data orang tua */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-500/20 flex items-center justify-center text-blue-600 mb-3"><User size={40} className="stroke-[1.5]" /></div>
            <h3 className="text-lg font-black text-gray-950 tracking-tight capitalize">{profile.full_name}</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold tracking-wider uppercase mt-1">{profile.relationship || "Wali Murid"}</span>
          </div>
          <div className="space-y-3 text-sm font-medium text-gray-600">
            <p className="flex items-center gap-3"><Mail size={16} className="text-gray-400 shrink-0" /> <span className="truncate">{profile.email || "-"}</span></p>
            <p className="flex items-center gap-3"><Phone size={16} className="text-gray-400 shrink-0" /> <span className="font-mono">{profile.phone || "-"}</span></p>
            <p className="flex items-center gap-3"><Briefcase size={16} className="text-gray-400 shrink-0" /> {profile.occupation || "-"}</p>
            <p className="flex items-start gap-3"><MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" /> {profile.address || "-"}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setEditing(true)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><Pencil size={14} /> Ubah Data</button>
            <button onClick={() => setPasswordOpen(true)} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"><KeyRound size={14} /> Ganti Password</button>
          </div>
          <p className="text-[11px] text-gray-400">Perubahan nama atau email dilakukan oleh Admin bimbel.</p>
        </div>

        {/* Anak & pendaftaran */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-950 tracking-tight">Anak Didik</h2>
              <button onClick={() => setRegisterOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl"><Plus size={16} /> Daftarkan Anak</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.children.length === 0 && (
                <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 italic">Belum ada anak yang terdaftar pada akun ini.</div>
              )}
              {profile.children.map((child) => (
                <div key={child.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><GraduationCap size={20} /></div>
                      <div>
                        <h4 className="font-bold text-gray-950">{child.name}</h4>
                        <p className="text-xs text-gray-400 font-bold">{child.nis} • {child.education_level} {child.grade && `Kelas ${child.grade}`}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${child.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{child.is_active ? "Aktif" : "Nonaktif"}</span>
                  </div>
                  {child.school_name && <p className="text-xs text-gray-500 flex items-center gap-1.5"><School size={14} /> {child.school_name}</p>}
                  <div className="space-y-1.5 border-t border-gray-50 pt-2">
                    {child.classes.length === 0 ? (
                      <p className="text-xs text-gray-400">Belum ditempatkan di kelas.</p>
                    ) : child.classes.map((c) => (
                      <p key={c.id} className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <Package size={15} className="text-blue-500" /> {c.name}
                        <span className="text-xs text-gray-400 font-medium">• {c.package_name}{c.package_price !== null && ` (${formatRupiah(c.package_price)}/bln)`}</span>
                      </p>
                    ))}
                  </div>
                  {!child.has_login && <p className="text-[11px] text-gray-400">Akun login siswa belum dibuat. Hubungi Admin bila anak perlu mengerjakan ujian online.</p>}
                </div>
              ))}
            </div>
          </div>

          {registrations.length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900">Riwayat Pendaftaran Anak</div>
              <div className="divide-y divide-gray-100">
                {registrations.map((r) => (
                  <div key={r.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="text-sm">
                      <p className="font-bold text-gray-900">{r.full_name}</p>
                      <p className="text-xs text-gray-500">{r.education_level?.name} • {r.package?.name} • diajukan {r.created_at}</p>
                      {r.status === "APPROVED" && <p className="text-xs text-emerald-700 mt-0.5">Terdaftar dengan NIS {r.student?.nis}{r.class_name && ` di kelas ${r.class_name}`}.</p>}
                      {r.review_note && <p className={`text-xs mt-0.5 ${r.status === "REJECTED" ? "text-rose-600" : "text-gray-500"}`}>Catatan Admin: {r.review_note}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
                      {r.status === "PENDING" && <button onClick={() => handleCancel(r)} className="text-xs font-bold text-gray-500 hover:text-rose-600">Batalkan</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal open={editing} profile={profile} onClose={() => setEditing(false)} onDone={(m) => { setEditing(false); done(m); }} />
      <ChangePasswordModal open={passwordOpen} submit={updateParentPassword} onClose={() => setPasswordOpen(false)} onDone={(m) => { setPasswordOpen(false); showSuccess(m); }} />
      <RegistrationModal open={registerOpen} onClose={() => setRegisterOpen(false)} onDone={(m) => { setRegisterOpen(false); done(m); }} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}

function ModalShell({ title, desc, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b pb-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-gray-950 tracking-tight">{title}</h3>
            {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = "w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm focus:outline-none focus:border-blue-500";
const labelClass = "text-xs font-bold text-gray-400 uppercase tracking-wider";

// Kirim form: onSubmit melempar error agar pesan tampil di modal
function useModalForm(submit, onDone) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await submit();
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, setError, handle };
}

function EditProfileModal({ open, profile, onClose, onDone }) {
  const [form, setForm] = useState({ phone: "", occupation: "", address: "", latitude: "", longitude: "" });
  const { saving, error, setError, handle } = useModalForm(() => updateParentProfile({
    ...form,
    latitude: form.latitude === "" ? null : form.latitude,
    longitude: form.longitude === "" ? null : form.longitude,
  }), onDone);

  useEffect(() => {
    if (open) {
      setForm({ phone: profile.phone || "", occupation: profile.occupation || "", address: profile.address || "", latitude: profile.latitude ?? "", longitude: profile.longitude ?? "" });
      setError("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalShell title="Ubah Data Kontak" onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div><label className={labelClass}>No. HP / WhatsApp</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" className={inputClass} /></div>
        <div><label className={labelClass}>Pekerjaan</label><input value={form.occupation} maxLength={100} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Alamat Rumah</label><textarea value={form.address} maxLength={500} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inputClass} min-h-[70px]`} /></div>
        {/* Titik rumah ikut tersimpan di data anak (tujuan absen tentor les private) */}
        <LocationPicker
          label="Titik Rumah"
          radius={100}
          height={200}
          value={{ latitude: form.latitude, longitude: form.longitude }}
          onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })}
        />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Menyimpan..." : "Simpan"}</button>
      </form>
    </ModalShell>
  );
}

function RegistrationModal({ open, onClose, onDone }) {
  const empty = { full_name: "", gender: "", birth_date: "", school_name: "", education_level_id: "", package_id: "", note: "", login_email: "" };
  const [form, setForm] = useState(empty);
  const [options, setOptions] = useState({ education_levels: [], packages: [] });
  const { saving, error, setError, handle } = useModalForm(() => submitParentRegistration({ ...form, package_id: form.package_id || null, login_email: form.login_email || null }), onDone);

  useEffect(() => {
    if (!open) return;
    setForm(empty);
    setError("");
    getRegistrationOptions().then((res) => setOptions(res.data.data)).catch((err) => setError(getApiErrorMessage(err, "Gagal memuat pilihan paket.")));
  }, [open]);

  if (!open) return null;

  const level = options.education_levels.find((l) => l.id === form.education_level_id);
  const packages = level ? options.packages.filter((p) => p.level === level.level) : options.packages;

  return (
    <ModalShell title="Daftarkan Anak" desc="Admin akan memeriksa dan menghubungi Anda sebelum anak ditempatkan di kelas." onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div><label className={labelClass}>Nama Lengkap Anak</label><input required maxLength={150} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Jenis Kelamin</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputClass} bg-white`}>
              <option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
            </select>
          </div>
          <div><label className={labelClass}>Tanggal Lahir</label><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className={inputClass} /></div>
        </div>
        <div><label className={labelClass}>Asal Sekolah</label><input maxLength={150} value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Jenjang / Kelas Sekolah</label>
          <select required value={form.education_level_id} onChange={(e) => setForm({ ...form, education_level_id: e.target.value, package_id: "" })} className={`${inputClass} bg-white`}>
            <option value="">-- Pilih --</option>
            {options.education_levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Paket Bimbingan</label>
          <select required={packages.length > 0} value={form.package_id} onChange={(e) => setForm({ ...form, package_id: e.target.value })} className={`${inputClass} bg-white`}>
            <option value="">-- Pilih Paket --</option>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({formatRupiah(p.price)}/bln)</option>)}
          </select>
          {level && packages.length === 0 && <p className="text-xs text-amber-700 mt-1">Belum ada paket untuk jenjang {level.level}. Tulis kebutuhan Anda di catatan.</p>}
        </div>
        <div>
          <label className={labelClass}>Email Login Anak (opsional)</label>
          <input type="email" maxLength={100} value={form.login_email} onChange={(e) => setForm({ ...form, login_email: e.target.value })} placeholder="Kosongkan = dibuatkan otomatis" className={inputClass} />
          <p className="text-[11px] text-gray-400 mt-1">Setelah disetujui Admin, email & password sementara dikirim ke notifikasi Anda (ikon lonceng).</p>
        </div>
        <div><label className={labelClass}>Catatan (opsional)</label><textarea maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Mapel yang ingin difokuskan, jadwal yang diinginkan, dll." className={`${inputClass} min-h-[70px]`} /></div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Mengirim..." : "Kirim Pendaftaran"}</button>
      </form>
    </ModalShell>
  );
}
