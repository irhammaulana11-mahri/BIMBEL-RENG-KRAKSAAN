import React, { useEffect, useState } from "react";
import {
  X, User, BookOpen, Users, Edit3, UserPlus, Layers, School, Calendar, MapPin, Video, Home, Building2,
} from "lucide-react";
import { getClassOverview } from "@/services/academic/classService";
import { MapView } from "../../../ui/LocationPicker";
import { ScheduleList, AttendanceBar } from "../../master/shared/OverviewBlocks";
import { formatRupiah } from "@/utils/format";

const STATUS_LABEL = { ON_PROGRESS: "Berjalan", COMPLETED: "Selesai", PLANNED: "Direncanakan", CANCELLED: "Dibatalkan" };
const TYPE_ICON = { ONLINE: Video, PRIVATE: Home, REGULER: Building2 };

/**
 * Drawer detail kelas. Data dari relasi kelas, mapel, tentor, siswa, jadwal & sesi (GET /admin/classes/{id}/overview).
 */
export default function ClassPreview({ classData, open, onClose, onManageStudents, onManageSubjects, onManageTentors }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    setOverview(null);
    setActiveTab("overview");
    if (open && classData?.id) getClassOverview(classData.id).then(res => setOverview(res.data.data)).catch(console.error);
  }, [open, classData]);

  if (!open || !classData) return null;

  const o = overview;
  const isActive = classData.is_active ?? true;
  const type = o?.class_type || classData.class_type || "REGULER";
  const TypeIcon = TYPE_ICON[type] || Building2;
  const subjects = o?.subjects || [];
  const tentors = subjects.filter((s) => s.tentor_name);
  const students = o?.students || [];
  const loading = <p className="text-center text-sm text-gray-400 py-8">Memuat data kelas...</p>;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200" />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-blue-50/60 relative shrink-0">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-white/70 rounded-xl"><X size={20} /></button>
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-white/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
            <TypeIcon size={12} /> Kelas {type}
          </span>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight mt-1.5">{classData.name}</h2>
          {classData.description && <p className="text-xs text-gray-500">{classData.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">{o?.level || classData.education_level || "-"}</span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{isActive ? "Aktif" : "Nonaktif"}</span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{STATUS_LABEL[classData.status] || classData.status || "Berjalan"}</span>
          </div>
        </div>

        <div className="border-b border-gray-100 px-5 pt-2 flex items-center gap-1 bg-white shrink-0 overflow-x-auto">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Layers size={14} />} label="Ringkasan" />
          <TabBtn active={activeTab === "subjects"} onClick={() => setActiveTab("subjects")} icon={<BookOpen size={14} />} label="Mapel" count={subjects.length} />
          <TabBtn active={activeTab === "tentors"} onClick={() => setActiveTab("tentors")} icon={<User size={14} />} label="Tentor" count={tentors.length} />
          <TabBtn active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={<Users size={14} />} label="Siswa" count={students.length} />
          <TabBtn active={activeTab === "schedules"} onClick={() => setActiveTab("schedules")} icon={<Calendar size={14} />} label="Jadwal" count={o?.schedules.length} />
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {activeTab === "overview" && (!o ? loading : (
            <div className="space-y-4">
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm">
                <InfoRow label="Paket" value={o.package ? `${o.package.name} • ${formatRupiah(o.package.price)} / bulan` : "Tanpa paket"} />
                <InfoRow label="Kapasitas" value={`${o.capacity.students} / ${o.capacity.max ?? "-"} siswa`} />
                <InfoRow label="Target Pertemuan" value={`${o.meeting_per_month || 0} sesi / bulan • ${o.duration_minutes || 0} menit per sesi`} />
                <InfoRow label="Dibuat" value={o.created_at} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={13} /> Lokasi Belajar</h3>
                <p className="text-sm font-bold text-gray-900">{o.location.label}</p>
                {o.location.address && <p className="text-xs text-gray-500">{o.location.address}</p>}
                <p className="text-[11px] text-gray-400">
                  {type === "PRIVATE" ? "Kelas private: lokasi mengikuti rumah siswa (titik absen GPS tentor)."
                    : type === "ONLINE" ? "Kelas online: tentor & siswa dapat belajar dari mana saja, tanpa absen GPS."
                    : "Kelas reguler: belajar di gedung bimbel yang ditentukan."}
                </p>
                {type !== "ONLINE" && <MapView latitude={o.location.latitude} longitude={o.location.longitude} radius={100} height={160} />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Kehadiran Siswa (sesi selesai)</h3>
                <AttendanceBar attendance={o.attendance} />
              </div>
            </div>
          ))}

          {activeTab === "subjects" && (!o ? loading : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Mapel & Progres Pertemuan</h3>
                <button onClick={() => onManageSubjects(classData)} className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"><Edit3 size={14} /> Kelola Mapel</button>
              </div>
              {subjects.length === 0 ? <Empty text="Belum ada mata pelajaran." /> : subjects.map((cs, i) => {
                const target = cs.scheduled || cs.meeting_target || 0;
                const pct = target ? Math.min(100, Math.round((cs.done / target) * 100)) : 0;
                return (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-gray-950 text-sm">{cs.subject_name}</h4>
                      <span className="text-xs font-bold text-gray-700 font-mono">{cs.done} / {target} pertemuan</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Tentor: <b className="text-gray-800">{cs.tentor_name || "Belum ditentukan"}</b></span>
                      <span className="text-gray-400">{cs.scheduled ? `${cs.scheduled} sesi terjadwal` : `target ${cs.meeting_target || 0} / bulan, belum dijadwalkan`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {activeTab === "tentors" && (!o ? loading : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Tentor Pengampu ({tentors.length})</h3>
                <button onClick={() => onManageTentors(classData)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={14} /> Kelola Tentor</button>
              </div>
              {tentors.length === 0 ? <Empty text="Belum ada tentor untuk kelas ini." /> : tentors.map((cs, i) => (
                <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-2xs flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm text-gray-950">{cs.tentor_name}</p>
                    <p className="text-xs text-purple-700 font-semibold mt-0.5 flex items-center gap-1"><BookOpen size={12} /> Mengampu: {cs.subject_name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Spesialisasi: {cs.specialization || "-"}</p>
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">{cs.done} sesi selesai</span>
                </div>
              ))}
            </div>
          ))}

          {activeTab === "students" && (!o ? loading : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Siswa ({students.length}/{o.capacity.max ?? "-"})</h3>
                <button onClick={() => onManageStudents(classData)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={14} /> Kelola Siswa</button>
              </div>
              {students.length === 0 ? <Empty text="Belum ada siswa terdaftar." /> : students.map((st) => (
                <div key={st.id} className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-2xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-gray-950">{st.full_name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-mono font-bold text-blue-600">{st.nis}</span>•
                      <span className="flex items-center gap-1 truncate max-w-[180px]"><School size={11} className="text-gray-400" /> {st.school_name || "-"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-md border border-slate-200">{st.level || "-"}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${st.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{st.is_active ? "Aktif" : "Nonaktif"}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {activeTab === "schedules" && (!o ? loading : <ScheduleList schedules={o.schedules} empty="Kelas ini belum dijadwalkan. Buat lewat menu Jadwal." />)}
        </div>
      </div>
    </>
  );
}

function Empty({ text }) {
  return <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-400 text-xs">{text}</div>;
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"}`}>
      {icon} <span>{label}</span>
      {count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>}
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold text-gray-900 text-right">{value || "-"}</span>
    </div>
  );
}
