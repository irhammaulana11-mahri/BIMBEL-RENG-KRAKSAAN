import React, { useState, useEffect, useCallback } from "react";
import { X, Layers, Calendar, Award, BarChart3, Info, Plus, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScheduleList, StatTiles, AttendanceBar } from "../shared/OverviewBlocks";
import CurriculumListView from "../../academic/curriculum/CurriculumListView";
import CurriculumFormView from "../../academic/curriculum/CurriculumFormView";
import CurriculumDetailView from "../../academic/curriculum/CurriculumDetailView";
import { useConfirm } from "@/components/ui/confirmation";
import { useToast } from "../../../../hooks/useToast";
import { getSubject, getSubjectOverview } from "../../../../services/admin/subjectService";
import { getCurriculumsBySubject, createCurriculum,toggleCurriculumStatus,updateCurriculum } from "../../../../services/academic/curriculumService";


export default function SubjectPreview({ subject: initialSubject, onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); 
  const [subject, setSubject] = useState(initialSubject);
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const navigate = useNavigate();
  
  // State Sub-view Kurikulum
  const [curriculumViewMode, setCurriculumViewMode] = useState("list"); // list | form | detail
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [editingCurriculum, setEditingCurriculum] = useState(null);

  const confirm = useConfirm();
  const { showSuccess, showError } = useToast();

  // 🟢 1. Reset Seluruh State ketika Drawer Ditutup
  const handleCloseDrawer = () => {
    setActiveTab("overview");
    setCurriculumViewMode("list");
    setSelectedCurriculum(null);
    setEditingCurriculum(null);
    onClose();
  };

  const fetchSubjectDetails = useCallback(() => {
    if (initialSubject?.id) {
      setLoading(true);
      getSubject(initialSubject.id)
        .then(res => setSubject(res))
        .catch(console.error)
        .finally(() => setLoading(false));

      getCurriculumsBySubject(initialSubject.id)
        .then(res => setCurriculums(res))
        .catch(console.error);

      // Jadwal hasil generate, ujian & statistik dari database
      setOverview(null);
      getSubjectOverview(initialSubject.id)
        .then(res => setOverview(res.data.data))
        .catch(console.error);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (initialSubject) {
      setActiveTab("overview");
      setCurriculumViewMode("list");
      setSelectedCurriculum(null);
      setEditingCurriculum(null);
      fetchSubjectDetails();
    }
  }, [initialSubject, fetchSubjectDetails]);

  if (!initialSubject) return null;
  const currentSubject = subject || initialSubject;
  const isActive = currentSubject.is_active ?? true;

  const handleSaveCurriculum = async (formData) => {
    try {
      setLoading(true);
      if (editingCurriculum?.id) {
        // Mode Update
        await updateCurriculum(editingCurriculum.id, formData);
        showSuccess("Berhasil memperbarui topik kurikulum.");
      } else {
        // Mode Create
        await createCurriculum(formData);
        showSuccess("Berhasil membuat topik kurikulum baru.");
      }
      
      // Refresh Data & Kembali ke daftar topik
      await fetchSubjectDetails();
      setEditingCurriculum(null);
      setCurriculumViewMode("list");
    } catch (err) {
      showError(err.response?.data?.message || "Gagal menyimpan data kurikulum.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCurriculum = (curr) => {
    setEditingCurriculum(curr);
    setCurriculumViewMode("form");
  };

  const handleToggleCurriculumStatus = async (curr) => {
    const isActivating = !curr.is_active;
    const actionText = isActivating ? "Mengaktifkan" : "Menonaktifkan";

    const ok = await confirm.confirm({
      title: `${actionText} Topik Kurikulum`,
      message: `Apakah Anda yakin ingin ${actionText.toLowerCase()} topik "${curr.title}"?`,
      confirmText: isActivating ? "Ya, Aktifkan" : "Ya, Non-Aktifkan",
      confirmButtonClass: isActivating ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      const res = await toggleCurriculumStatus(curr.id);
      showSuccess(res.message || "Status kurikulum berhasil diperbarui.");
      fetchSubjectDetails();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengubah status kurikulum.");
    } finally {
      confirm.setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop Dimmer */}
      <div onClick={handleCloseDrawer} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs animate-in fade-in" />
      
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[580px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        
        {/* HEADER DRAWER */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/80 shrink-0 relative">
          <button 
            type="button" 
            onClick={handleCloseDrawer} 
            className="absolute right-5 top-5 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {currentSubject.code}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-950 mt-2">{currentSubject.name}</h2>
          <p className="text-xs text-gray-500 mt-1">{currentSubject.description || "Tidak ada deskripsi tambahan."}</p>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-gray-100 px-6 pt-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <TabButton active={activeTab === "overview"} onClick={() => { setActiveTab("overview"); setCurriculumViewMode("list"); }} icon={<Info size={15}/>} label="Ringkasan" />
          <TabButton active={activeTab === "curriculum"} onClick={() => setActiveTab("curriculum")} icon={<Layers size={15}/>} label="Kurikulum" count={curriculums.length} />
          <TabButton active={activeTab === "schedule"} onClick={() => { setActiveTab("schedule"); setCurriculumViewMode("list"); }} icon={<Calendar size={15}/>} label="Jadwal" count={overview?.schedules.length ?? currentSubject.schedules_count ?? 0} />
          <TabButton active={activeTab === "exam"} onClick={() => { setActiveTab("exam"); setCurriculumViewMode("list"); }} icon={<Award size={15}/>} label="Ujian" count={overview?.exams.length ?? currentSubject.exams_count ?? 0} />
          <TabButton active={activeTab === "statistics"} onClick={() => { setActiveTab("statistics"); setCurriculumViewMode("list"); }} icon={<BarChart3 size={15}/>} label="Statistik" />
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading && activeTab !== "curriculum" ? (
             <div className="text-center p-10 text-sm font-medium text-gray-400">Memuat detail mata pelajaran...</div>
          ) : (
            <>
              {/* 🟢 TAB 1: OVERVIEW LENGKAP */}
              {activeTab === "overview" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kode Mapel</p>
                       <p className="text-sm font-bold text-gray-900 mt-1">{currentSubject.code}</p>
                    </div>
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Jenjang (Level)</p>
                       <p className="text-sm font-bold text-gray-900 mt-1">{currentSubject.education_level_name || currentSubject.education_level?.display_name || "-"}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Statistik Sub-Data</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <StatBox label="Kurikulum" value={curriculums.length} color="text-purple-600" />
                      <StatBox label="Materi" value={currentSubject.materials_count || 0} color="text-blue-600" />
                      <StatBox label="Tentor" value={currentSubject.tentors_count || 0} color="text-emerald-600" />
                      <StatBox label="Jadwal" value={overview?.schedules.length ?? currentSubject.schedules_count ?? 0} color="text-amber-600" />
                      <StatBox label="Ujian" value={overview?.exams.length ?? currentSubject.exams_count ?? 0} color="text-rose-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CURRICULUM */}
              {activeTab === "curriculum" && (
                <>
                  {curriculumViewMode === "list" && (
                    <CurriculumListView 
                      curriculums={curriculums} 
                      onAdd={() => { setEditingCurriculum(null); setCurriculumViewMode("form"); }} 
                      onSelectDetail={(curr) => { setSelectedCurriculum(curr); setCurriculumViewMode("detail"); }}
                      onEdit={handleEditCurriculum}
                      onToggleStatus={handleToggleCurriculumStatus}
                    />
                  )}

                  {curriculumViewMode === "form" && (
                    <CurriculumFormView 
                      subject={currentSubject} 
                      initialData={editingCurriculum}
                      onBack={() => { setEditingCurriculum(null); setCurriculumViewMode("list"); }} 
                      onSubmit={handleSaveCurriculum}
                      loading={loading}
                    />
                  )}

                  {curriculumViewMode === "detail" && (
                    <CurriculumDetailView 
                      curriculum={selectedCurriculum} 
                      onBack={() => setCurriculumViewMode("list")} 
                    />
                  )}
                </>
              )}

              {/* TAB LAINNYA */}
              {activeTab === "schedule" && (
                overview ? <ScheduleList schedules={overview.schedules} showSubject={false} empty="Belum ada jadwal untuk mapel ini. Buat lewat menu Jadwal." />
                  : <p className="text-center text-sm text-gray-400 py-10">Memuat jadwal...</p>
              )}

              {activeTab === "exam" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Bank Ujian & Soal</h3>
                    <button onClick={() => navigate(`/admin/exam?create=${currentSubject.id}`)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                      <Plus size={14} /> Buat Ujian
                    </button>
                  </div>
                  {!overview ? <p className="text-center text-sm text-gray-400 py-10">Memuat ujian...</p>
                    : overview.exams.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">Belum ada ujian untuk mapel ini.</div>
                    ) : overview.exams.map((e) => (
                      <div key={e.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{e.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {e.questions_count} soal • {e.duration || "-"} menit • {e.results_count} dikerjakan
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${e.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {e.status === "PUBLISHED" ? "Terbit" : e.status === "DRAFT" ? "Draf" : e.status}
                          </span>
                        </div>
                        <button onClick={() => navigate(`/admin/exam?questions=${e.id}`)} className="shrink-0 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1">
                          <ListChecks size={14} /> Kelola Soal
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === "statistics" && (
                !overview ? <p className="text-center text-sm text-gray-400 py-10">Memuat statistik...</p> : (
                  <div className="space-y-5">
                    <StatTiles items={[
                      { label: "Kelas", value: overview.statistics.classes, tone: "indigo" },
                      { label: "Siswa", value: overview.statistics.students, tone: "blue" },
                      { label: "Tentor Mengajar", value: overview.statistics.tentors, tone: "purple" },
                      { label: "Sesi Selesai", value: `${overview.statistics.sessions_done}/${overview.statistics.sessions_total}`, hint: "dari seluruh sesi terjadwal", tone: "emerald" },
                      { label: "Ujian Terbit", value: overview.statistics.exams_published, hint: `${overview.statistics.exam_results} hasil dinilai`, tone: "amber" },
                      { label: "Rata-rata Nilai", value: overview.statistics.exam_average ?? "-", tone: "rose" },
                    ]} />
                    <div>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Kehadiran Siswa (sesi selesai)</h3>
                      <AttendanceBar attendance={overview.statistics.attendance} />
                    </div>
                  </div>
                )
              )}
            </>
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

function StatBox({ label, value, color }) {
  return (
    <div className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-2xs text-center">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}