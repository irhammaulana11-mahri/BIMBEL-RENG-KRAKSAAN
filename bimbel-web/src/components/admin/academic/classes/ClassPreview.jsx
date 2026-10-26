import React, { useState } from "react";
import { 
  X, User, BookOpen, Users, Edit3, UserPlus, Layers, GraduationCap, School
} from "lucide-react";

export default function ClassPreview({ 
  classData, 
  open, 
  onClose, 
  onEdit, 
  onManageStudents, 
  onManageSubjects, 
  onManageTentors 
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !classData) return null;

  const isActive = classData.is_active ?? true;
  const studentCount = classData.students_count ?? classData.students?.length ?? classData.class_students?.length ?? 0;
  const subjectCount = classData.subject_count ?? classData.class_subjects?.length ?? 0;
  const tentorCount = classData.tentor_count ?? 0;
  const maxCapacity = classData.max_students ?? 10;
  const classSubjects = classData.class_subjects || [];
  const students = classData.students || [];

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200" 
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Header Sheet */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/80 relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            KELAS {classData.class_type || "REGULER"}
          </span>
          <h2 className="text-2xl font-black text-gray-950 tracking-tight mt-1.5">{classData.name}</h2>
          <p className="text-xs text-gray-400">{classData.description || "KBM Berjalan Sesuai Target Kurikulum."}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Jenjang {classData.education_level || "SD"}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
              isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
              Status: {classData.status || "ON_PROGRESS"}
            </span>
          </div>
        </div>

        {/* Tab Navigation (Hanya Overview, Mapel, Tentor, Siswa) */}
        <div className="border-b border-gray-100 px-5 pt-2 flex items-center gap-1 bg-white shrink-0 overflow-x-auto">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Layers size={14}/>} label="Overview" />
          <TabBtn active={activeTab === "subjects"} onClick={() => setActiveTab("subjects")} icon={<BookOpen size={14}/>} label="Mapel" count={subjectCount} />
          <TabBtn active={activeTab === "tentors"} onClick={() => setActiveTab("tentors")} icon={<User size={14}/>} label="Tentor" count={tentorCount} />
          <TabBtn active={activeTab === "students"} onClick={() => setActiveTab("students")} icon={<Users size={14}/>} label="Siswa" count={studentCount} />
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm text-gray-700">
                <InfoRow label="Package Terikat" value={classData.package_name || "-"} />
                <InfoRow label="Cabang Gedung" value={classData.location_name || "Gedung Pusat"} />
                <InfoRow label="Kapasitas Kuota" value={`${studentCount} / ${maxCapacity} Siswa`} isMono />
                <InfoRow label="Target Meeting" value={`${classData.meeting_per_month || 0} Sesi / Bulan`} isMono />
                <InfoRow label="Durasi KBM" value={`${classData.duration_minutes || 0} Menit`} isMono />
                <InfoRow label="Tanggal Dibuat" value={classData.created_at || "-"} isMono />
              </div>
            </div>
          )}

          {/* TAB 2: MATA PELAJARAN */}
          {activeTab === "subjects" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Kontrak Penugasan Subject</h3>
                <button onClick={() => onManageSubjects(classData)} className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <Edit3 size={14} /> Kelola Mapel
                </button>
              </div>

              {classSubjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {classSubjects.map((cs, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-gray-950 text-sm">{cs.subject_name}</h4>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-md border border-blue-100 font-mono">
                          {cs.meeting_target || 16} Meeting Target
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 border-t border-gray-100 pt-2">
                        <span className="font-bold">Tentor: <strong className="text-xs text-gray-700">{cs.tentor_name || "Belum Diplot"}</strong></span>
                        <span className="font-bold text-gray-700 font-mono">Progress: {cs.progress || 0} / {cs.meeting_target || 16}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-400 text-xs">Belum ada mata pelajaran.</div>
              )}
            </div>
          )}

          {/* TAB 3: TENTOR (Nama, Specialization, Education) */}
          {activeTab === "tentors" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Daftar Tentor Pengampu ({tentorCount})</h3>
                <button onClick={() => onManageTentors(classData)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <UserPlus size={14} /> Kelola Tentor
                </button>
              </div>

              {classSubjects.filter(cs => cs.tentor_name).length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {classSubjects.map((cs, i) => (
                    cs.tentor_name && (
                      <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-2xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-950">{cs.tentor_name}</p>
                            <p className="text-xs text-purple-700 font-semibold mt-0.5 flex items-center gap-1">
                              <BookOpen size={12} /> Mengampu: {cs.subject_name}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-100">
                            {classData.education_level}
                          </span>
                        </div>

                        <div className="border-t border-gray-50 pt-2 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="truncate max-w-[260px]" title={cs.subject_name}>
                            Spesialisasi: <strong className="font-bold text-[12px] text-gray-700">{cs.specialization}</strong>
                          </span>
                          <span className="font-bold text-[12px] text-gray-700">Target: {cs.meeting_target} Sesi</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-400 text-xs">
                  Belum ada tentor yang diplot untuk kelas ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SISWA (Nama Siswa, NIS, School Name, Grade) */}
          {activeTab === "students" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Daftar Siswa ({studentCount}/{maxCapacity})</h3>
                <button onClick={() => onManageStudents(classData)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <UserPlus size={14} /> Kelola Siswa
                </button>
              </div>

              {students.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {students.map((st, i) => (
                    <div key={i} className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-2xs flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-gray-950">{st.full_name || st.name}</p>
                        
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="font-mono font-bold text-blue-600">{st.nis}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate max-w-[180px]" font-bold title={st.school || st.school_name}>
                            <School size={11} className="text-gray-400 " /> {st.school || st.school_name || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[11px] rounded-md border border-slate-200">
                          Kelas {st.grade}
                        </span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200">
                          Aktif
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed text-gray-400 text-xs">
                  Belum ada siswa terdaftar.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </>
  );
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"
      }`}
    >
      {icon} <span>{label}</span>
      {count !== undefined && (
        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-mono">
          {count}
        </span>
      )}
    </button>
  );
}

function InfoRow({ label, value, isMono = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 font-bold uppercase text-[10px]">{label}</span>
      <span className={`font-bold text-gray-900 ${isMono ? "font-mono" : ""}`}>{value || "-"}</span>
    </div>
  );
}