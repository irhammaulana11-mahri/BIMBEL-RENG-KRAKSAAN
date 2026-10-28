import React, { useState, useEffect } from "react";
import { 
  X, User, Phone, Mail, MapPin, GraduationCap,
  Calendar, CheckCircle2, Edit3, PlusCircle, Clock, Info, Layers, BarChart3
} from "lucide-react";
import { getAvatarColor } from "../../../utils/avatarColor";
import TentorEditForm from "./TentorEditForm"; // Import komponen edit terpisah
import { getTentorOverview } from "@/services/admin/tentorService";
import { ScheduleList, StatTiles } from "../shared/OverviewBlocks";

export default function TentorPreview({ tentor, open, onClose, onSaveProfile, onPlotSubject, loading }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview | assignment | schedule | statistic
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [overview, setOverview] = useState(null);

  // Reset mode edit saat drawer dibuka/ditutup/berganti tentor; jadwal & statistik dari database
  useEffect(() => {
    if (tentor) {
      setIsEditingProfile(false);
    }
    setOverview(null);
    if (open && tentor?.id) {
      getTentorOverview(tentor.id).then(res => setOverview(res.data.data)).catch(console.error);
    }
  }, [tentor?.id, open]);

  if (!open || !tentor) return null;

  const isActive = tentor.user?.is_active ?? tentor.is_active ?? true;
  const avatarStyle = getAvatarColor(tentor.name || tentor.user?.name || "");

  const handleSaveProfile = async (formData) => {
    if (onSaveProfile) {
      await onSaveProfile(tentor.id, formData);
      setIsEditingProfile(false); // Kembalikan ke mode view setelah simpan
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200" />

      {/* Drawer Container */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Header Drawer */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/70 relative shrink-0">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center shadow-xs shrink-0 border ${avatarStyle}`}>
              {tentor.name ? tentor.name.substring(0, 2).toUpperCase() : tentor.user?.name ? tentor.user.name.substring(0, 2).toUpperCase() : "TT"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {isActive ? "Aktif Mengajar" : "Nonaktif"}
                </span>
                <span className="text-[10px] font-mono text-gray-400">Bergabung: {tentor.joining_date || "-"}</span>
              </div>
              <h2 className="text-xl font-black text-gray-950 tracking-tight mt-1">{tentor.name || tentor.user?.name}</h2>
              <p className="text-xs font-bold text-blue-600">Spesialisasi: {tentor.specialization || "-"}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-100 px-6 pt-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none bg-white">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Info size={15}/>} label="Profil" />
          <TabButton active={activeTab === "assignment"} onClick={() => setActiveTab("assignment")} icon={<Layers size={15}/>} label="Mapel" count={tentor.subjects?.length || 0} />
          <TabButton active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} icon={<Calendar size={15}/>} label="Jadwal" count={overview?.schedules.length ?? 0} />
          <TabButton active={activeTab === "statistic"} onClick={() => setActiveTab("statistic")} icon={<BarChart3 size={15}/>} label="Statistik" />
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Header Tab & Toggle Button */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  {isEditingProfile ? "Koreksi Profil Tentor" : "Informasi & Kontak Tentor"}
                </h3>
                
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isEditingProfile 
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <Edit3 size={14} /> {isEditingProfile ? "Batal Edit" : "Edit Profil"}
                </button>
              </div>

              {/* MODE READ-ONLY vs MODE FORM EDIT INLINE */}
              {!isEditingProfile ? (
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <InfoRow icon={<Mail size={16} />} label="Email Login" value={tentor.user?.email || tentor.email} />
                  <InfoRow icon={<Phone size={16} />} label="No. WhatsApp / Telepon" value={tentor.phone || tentor.user?.phone} isMono />
                  <InfoRow icon={<User size={16} />} label="NIK" value={tentor.nik} isMono />
                  <InfoRow icon={<GraduationCap size={16} />} label="Pendidikan Terakhir" value={tentor.education} />
                  <InfoRow icon={<MapPin size={16} />} label="Alamat Domisili" value={tentor.address} />
                </div>
              ) : (
                /* Memanggil Komponen Edit Form Terpisah */
                <TentorEditForm 
                  tentor={tentor}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditingProfile(false)}
                  loading={loading}
                />
              )}
            </div>
          )}

          {/* TAB 2: ASSIGNMENT */}
          {activeTab === "assignment" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Mata Pelajaran Dikuasai</h3>
                <button
                  type="button"
                  onClick={() => onPlotSubject(tentor)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <PlusCircle size={14} /> Atur Mapel
                </button>
              </div>

              {tentor.subjects && tentor.subjects.length > 0 ? (
                <div className="space-y-2">
                  {tentor.subjects.map((sub, i) => (
                    <div key={i} className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-950 text-xs">{sub.name}</h4>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">{sub.code || "KODE-MAPEL"}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100">
                        {sub.education_level_name || sub.education_level?.display_name || sub.education_level || "SD/SMP/SMA"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                  Belum ada mata pelajaran. Klik tombol di atas untuk menambah.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JADWAL (pola jadwal hasil generate + sesi mendatang) */}
          {activeTab === "schedule" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {!overview ? <p className="text-center text-sm text-gray-400 py-10">Memuat jadwal...</p> : (
                <>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Jadwal Mengajar ({overview.schedules.length})</h3>
                  <ScheduleList schedules={overview.schedules} showTentor={false} empty="Belum ada jadwal mengajar. Jadwal dibuat lewat menu Jadwal." />
                  {overview.upcoming.length > 0 && (
                    <>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pt-2">Sesi Mendatang</h3>
                      <div className="space-y-1.5">
                        {overview.upcoming.map((u, i) => (
                          <div key={i} className="flex justify-between text-xs bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                            <span className="font-bold text-gray-800 flex items-center gap-1.5"><Clock size={12} className="text-blue-500" /> {u.session_date} • {u.start_time}-{u.end_time}</span>
                            <span className="text-gray-500 truncate ml-2">{u.subject_name} • {u.class_name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: STATISTIK */}
          {activeTab === "statistic" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Ringkasan Mengajar</h3>
              {!overview ? <p className="text-center text-sm text-gray-400 py-10">Memuat statistik...</p> : (
                <StatTiles items={[
                  { label: "Kelas Diampu", value: overview.statistics.classes, tone: "indigo" },
                  { label: "Siswa Diajar", value: overview.statistics.students, tone: "blue" },
                  { label: "Mapel Dikuasai", value: overview.statistics.subjects, tone: "purple" },
                  { label: "Sesi Selesai", value: `${overview.statistics.sessions_done}/${overview.statistics.sessions_total}`, hint: `${overview.statistics.sessions_month} sesi bulan ini`, tone: "emerald" },
                  { label: "Jam Mengajar", value: overview.statistics.teaching_hours, hint: `${overview.statistics.attended} kali absen hadir`, tone: "amber" },
                  { label: "Catatan Absen", value: overview.statistics.late_count + overview.statistics.outside_area, hint: `${overview.statistics.late_count} terlambat • ${overview.statistics.outside_area} di luar lokasi`, tone: "rose" },
                ]} />
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"
      }`}
    >
      {icon} <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InfoRow({ icon, label, value, isMono = false }) {
  return (
    <div className="flex gap-3 items-start text-sm">
      <div className="text-blue-600 bg-white p-1.5 rounded-lg border border-gray-100 shrink-0 mt-0.5">{icon}</div>
      <div className="space-y-0.5 overflow-hidden">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className={`text-gray-900 font-bold text-xs truncate ${isMono ? 'font-mono' : ''}`}>{value || '-'}</div>
      </div>
    </div>
  );
}