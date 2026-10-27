import React, { useEffect, useState } from "react";
import { Mail, Phone, School, GraduationCap, CalendarDays, KeyRound, Users, BookOpen } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import { getStudentProfile, updateStudentPassword } from "@/services/student/learningService";
import { getApiErrorMessage } from "@/utils/apiError";

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { toast, showSuccess, hideToast } = useToast();

  useEffect(() => {
    getStudentProfile()
      .then((res) => setProfile(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat profil.")));
  }, []);

  if (!profile) return <div className="p-12 text-center text-sm font-bold text-gray-400">{error || "Memuat profil..."}</div>;

  const info = [
    { icon: Mail, label: "Email login", value: profile.email },
    { icon: Phone, label: "No. HP", value: profile.phone },
    { icon: GraduationCap, label: "Jenjang", value: profile.education_level },
    { icon: School, label: "Asal sekolah", value: profile.school_name },
    { icon: CalendarDays, label: "Tanggal lahir", value: profile.birth_date },
  ];

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Data diri, kelas, dan keamanan akun. Perubahan data diri dilakukan oleh Admin bimbel.</p>
      </div>

      <div className="border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-2xl font-black">{initials(profile.name)}</div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{profile.name}</h3>
              <p className="text-xs font-bold text-indigo-600 font-mono">{profile.nis}</p>
            </div>
          </div>
          <button onClick={() => setPasswordOpen(true)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50"><KeyRound size={14} /> Ganti Password</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400 font-semibold">{label}</p><p className="font-bold text-gray-800">{value || "-"}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5"><BookOpen size={16} className="text-indigo-600" /> Kelas Saya</p>
          {profile.classes.length === 0 ? <p className="text-sm text-gray-400">Belum ditempatkan di kelas. Hubungi Admin bimbel.</p> : (
            <div className="space-y-2">
              {profile.classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-800">{c.name}</span>
                  <span className="text-xs text-gray-500">{c.class_type}{c.package_name && ` • ${c.package_name}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5"><Users size={16} className="text-indigo-600" /> Orang Tua / Wali</p>
          {profile.parents.length === 0 ? <p className="text-sm text-gray-400">Belum ada data orang tua.</p> : (
            <div className="space-y-2">
              {profile.parents.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.relationship || "-"}{p.phone && ` • ${p.phone}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} submit={updateStudentPassword} onClose={() => setPasswordOpen(false)} onDone={(m) => { setPasswordOpen(false); showSuccess(m); }} />
    </div>
  );
}
