import React, { useEffect, useState } from "react";
import {
  X, User, Phone, Mail, MapPin, School, BookOpen, Clock, CheckCircle2, Award, KeyRound, Wallet, Users, ExternalLink,
} from "lucide-react";
import { getStudentOverview, createStudentAccount } from "@/services/admin/studentService";
import { resetUserPassword } from "@/services/admin/userService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";
import { mapsLink } from "@/utils/geo";

// "2015-05-01" -> "1 Mei 2015 (11 tahun)"; kosong -> petunjuk untuk diisi
const formatBirthDate = (value) => {
  if (!value) return "Tanggal lahir belum diisi";
  const date = new Date(`${value}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age--;
  return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} (${age} tahun)`;
};

const RELATIONSHIP = { orang_tua: "Orang Tua", ayah: "Ayah", ibu: "Ibu", wali: "Wali" };

/**
 * Drawer detail siswa. Semua data dari relasi database (GET /admin/students/{id}/overview).
 */
export default function StudentPreview({ student, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!student?.id) return;
    setLoading(true);
    setError("");
    getStudentOverview(student.id)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat detail murid.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setData(null);
    load();
  }, [student?.id]);

  if (!student) return null;

  const d = data;
  const isActive = d?.is_active ?? student.is_active;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200" />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[520px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 relative">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-white/70 rounded-xl"><X size={20} /></button>
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-white/80 px-2.5 py-1 rounded-md">Detail Murid</span>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight mt-2">{d?.full_name || student.full_name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-mono font-bold text-gray-600 bg-white/80 px-2.5 py-0.5 rounded-md">NIS: {d?.nis || student.nis || "-"}</span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${isActive ? "bg-green-50 text-green-700 border-green-200/60" : "bg-red-50 text-red-700 border-red-200/60"}`}>
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
            {d?.level && <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">{d.level}</span>}
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {loading && !d && <p className="text-center text-sm text-gray-400 py-10">Memuat detail murid...</p>}
          {error && <p className="text-center text-sm font-semibold text-rose-600 py-4">{error}</p>}

          {d && (
            <>
              {/* Ringkasan angka */}
              <div className="grid grid-cols-3 gap-3">
                <MiniStat icon={<CheckCircle2 size={16} />} tone="emerald" label="Kehadiran" value={d.attendance.rate != null ? `${d.attendance.rate}%` : "-"} hint={`${d.attendance.hadir}/${d.attendance.total} sesi`} />
                <MiniStat icon={<Award size={16} />} tone="blue" label="Rata-rata Ujian" value={d.exams.average ?? "-"} hint={`${d.exams.count} ujian dinilai`} />
                <MiniStat icon={<Wallet size={16} />} tone={d.billing.outstanding > 0 ? "rose" : "slate"} label="Sisa Tagihan" value={d.billing.outstanding > 0 ? formatRupiah(d.billing.outstanding) : "Lunas"} hint={`${d.billing.open_count} tagihan terbuka`} small />
              </div>

              <Section title="Data Pribadi & Rumah">
                <InfoRow icon={<School size={16} />} label="Sekolah" value={d.school_name} />
                <InfoRow icon={<User size={16} />} label="Jenis Kelamin / Tgl Lahir" value={`${d.gender === "P" ? "Perempuan" : d.gender === "L" ? "Laki-laki" : "-"} • ${formatBirthDate(d.birth_date)}`} />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Alamat Rumah (titik absen les private)"
                  value={d.home.address}
                  extra={d.home.latitude != null && (
                    <a href={mapsLink(d.home.latitude, d.home.longitude)} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                      Lihat titik di peta <ExternalLink size={10} />
                    </a>
                  )}
                />
              </Section>

              <Section title={`Orang Tua / Wali (${d.parents.length})`}>
                {d.parents.length === 0 && <p className="text-xs text-gray-400 italic">Belum terhubung dengan orang tua.</p>}
                {d.parents.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <InfoRow icon={<Users size={16} />} label={RELATIONSHIP[p.relationship] || p.relationship || "Wali"} value={`${p.full_name}${p.occupation ? ` • ${p.occupation}` : ""}`} />
                    <InfoRow icon={<Phone size={16} />} label="No. WhatsApp" value={p.phone} isMono />
                    <InfoRow icon={<Mail size={16} />} label="Email" value={p.email} />
                  </div>
                ))}
              </Section>

              <Section title={`Kelas & Jadwal (${d.classes.length} kelas)`}>
                {d.classes.length === 0 && <p className="text-xs text-gray-400 italic">Belum ditempatkan di kelas mana pun.</p>}
                {d.classes.map((c) => (
                  <div key={c.id} className="p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{c.class_type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.package_name || "Tanpa paket"}</p>
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><BookOpen size={12} className="text-blue-500" /> {c.subjects.join(", ") || "-"}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1"><User size={12} className="text-amber-500" /> {c.tentors.join(", ") || "Tentor belum ditentukan"}</p>
                  </div>
                ))}
                {d.schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs bg-white rounded-xl border border-gray-100 px-3 py-2">
                    <span className="flex items-center gap-1.5 font-bold text-gray-800"><Clock size={12} className="text-blue-500" /> {s.day_name}, {s.start_time}-{s.end_time}</span>
                    <span className="text-gray-500 truncate ml-2">{s.subject_name} • {s.location}{s.next_date ? ` • berikutnya ${s.next_date}` : ""}</span>
                  </div>
                ))}
              </Section>

              <Section title="Kehadiran (sesi selesai)">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[["Hadir", d.attendance.hadir, "text-emerald-700 bg-emerald-50"], ["Izin", d.attendance.izin, "text-blue-700 bg-blue-50"], ["Sakit", d.attendance.sakit, "text-amber-700 bg-amber-50"], ["Alpa", d.attendance.alpa, "text-rose-700 bg-rose-50"]].map(([label, value, cls]) => (
                    <div key={label} className={`rounded-xl py-2 ${cls}`}>
                      <p className="text-lg font-black">{value}</p>
                      <p className="text-[10px] font-bold uppercase">{label}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {d.exams.recent.length > 0 && (
                <Section title="Nilai Ujian Terakhir">
                  {d.exams.recent.map((r, i) => (
                    <div key={i} className="flex justify-between text-xs bg-white rounded-xl border border-gray-100 px-3 py-2">
                      <span><b className="text-gray-800">{r.title}</b> <span className="text-gray-400">• {r.subject_name} • {r.submitted_at}</span></span>
                      <span className="font-black text-blue-700">{r.score}</span>
                    </div>
                  ))}
                </Section>
              )}

              <AccountSection data={d} onChanged={() => { load(); onChanged?.(); }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Akun login siswa (portal siswa: ujian, materi, rapor)
function AccountSection({ data, onChanged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await createStudentAccount(data.id, { email, password: password || null });
      setMessage(res.data.temporary_password
        ? `Akun dibuat. Password sementara: ${res.data.temporary_password} (sampaikan ke siswa).`
        : "Akun dibuat dengan password yang Anda isi.");
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal membuat akun."));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await resetUserPassword(data.account.user_id);
      setMessage(`Password direset. Password sementara: ${res.data.temporary_password}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mereset password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Akun Login Siswa">
      {data.account ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <InfoRow icon={<KeyRound size={16} />} label={data.account.is_active ? "Aktif" : "Nonaktif"} value={data.account.email} />
          <button type="button" onClick={reset} disabled={saving} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
            Reset Password
          </button>
        </div>
      ) : (
        <form onSubmit={create} className="space-y-2">
          <p className="text-xs text-gray-500">Siswa belum memiliki akun. Akun dipakai untuk mengerjakan ujian online, melihat materi, dan rapor.</p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email login siswa" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (kosongkan = dibuatkan otomatis)" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button type="submit" disabled={saving} className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
            {saving ? "Memproses..." : "Buat Akun Login"}
          </button>
        </form>
      )}
      {message && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-2 break-all">{message}</p>}
      {error && <p className="text-xs font-semibold text-rose-600 mt-2">{error}</p>}
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{title}</h3>
      <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">{children}</div>
    </div>
  );
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  slate: "bg-slate-50 text-slate-700 border-slate-100",
};

function MiniStat({ icon, label, value, hint, tone, small }) {
  return (
    <div className={`rounded-2xl border p-3 ${TONES[tone]}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-80">{icon} {label}</div>
      <p className={`${small ? "text-sm" : "text-xl"} font-black mt-1`}>{value}</p>
      <p className="text-[10px] opacity-70">{hint}</p>
    </div>
  );
}

function InfoRow({ icon, label, value, isMono = false, extra }) {
  return (
    <div className="flex gap-3 items-start text-sm">
      <div className="text-blue-600 bg-white p-1.5 rounded-lg border border-gray-100 shrink-0 mt-0.5">{icon}</div>
      <div className="space-y-0.5 overflow-hidden">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className={`text-gray-900 font-bold text-sm ${isMono ? "font-mono" : ""}`}>{value || "-"}</div>
        {extra}
      </div>
    </div>
  );
}
