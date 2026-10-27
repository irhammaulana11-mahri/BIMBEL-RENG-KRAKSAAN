import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getApiErrorMessage } from "@/utils/apiError";
import { Search, BookOpen, FileText, ClipboardCheck, Plus, RotateCcw, RefreshCw, Layers } from "lucide-react";
import SubjectModal from "../../../components/admin/master/subject/SubjectModal";
import SubjectPreview from "../../../components/admin/master/subject/SubjectPreview";
import SubjectTable from "../../../components/admin/master/subject/SubjectTable";
import PremiumStatCard from "../../../components/ui/StatCard";
import { createSubject, deleteSubject, getSubjects, updateSubject, getSubjectStatistics,getEducationLevels,toggleSubjectStatus, } from "../../../services/admin/subjectService";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import useDebounce from "@/hooks/useDebounce";
import { useConfirm } from "@/components/ui/confirmation";

export default function SubjectPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [previewSubject, setPreviewSubject] = useState(null);
  
  // Data Dinamis
  const [educationLevels, setEducationLevels] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    total_subjects: 0,
    total_curriculums: 0,
    total_materials: 0,
    total_exams: 0,
  });

  const [filters, setFilters] = useState({ keyword: "", status: "", education_level_id: "" });
  const keyword = useDebounce(filters.keyword, 500);
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });

  const query = useMemo(() => ({
    keyword,
    status: filters.status,
    education_level_id: filters.education_level_id,
    page: pagination.page,
    perPage: pagination.perPage,
  }), [keyword, filters.status, filters.education_level_id, pagination.page, pagination.perPage]);

  // Load Data Pendukung
  useEffect(() => {
    getEducationLevels()
      .then(data => setEducationLevels(data))
      .catch(err => console.error("Gagal load jenjang:", err));
       
    getSubjectStatistics()
      .then(stats => setGlobalStats(stats))
      .catch(console.error);
  }, []);

  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getSubjects(params);
      const { data, meta } = response.data;
      setSubjects(data);
      setPagination(prev => ({ ...prev, page: meta.current_page, total: meta.total, lastPage: meta.last_page }));
    } catch (err) {
      showError("Gagal memuat data Mata Pelajaran.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      if (selectedSubject) {
          await updateSubject(selectedSubject.id, form);
          showSuccess("Berhasil memperbaharui Mata Pelajaran.");
      } else {
          await createSubject(form);
          showSuccess("Berhasil membuat Mata Pelajaran baru.");
      }
      await loadData();
      getSubjectStatistics().then(setGlobalStats); // Refresh Dashboard Card
      setModalOpen(false);
    } catch (err) {
      showError("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({ title: "Hapus Mata Pelajaran", message: "Data akan dihapus permanen." });
    if (!ok) return;
    try {
      confirm.setLoading(true);
      await deleteSubject(id);
      showSuccess("Data berhasil dihapus.");
      await loadData();
      getSubjectStatistics().then(setGlobalStats);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menghapus mata pelajaran."));
    } finally {
      confirm.setLoading(false);
    }
  };  

  const handleEdit = (item) => {
    setSelectedSubject(item);
    setModalOpen(true);
  };

  const handleView = async (subject) => {
    try {
      // Fetch data detail subject beserta schedules & tentors
      const fullSubjectData = await getSubject(subject.id);
      setPreviewSubject(fullSubjectData);
    } catch (err) {
      // Fallback jika API error
      setPreviewSubject(subject);
    }
  };


  const handleToggleStatus = async (item) => {
    const isActivating = !item.is_active;
    const actionText = isActivating ? "Mengaktifkan" : "Menonaktifkan";

    const ok = await confirm.confirm({
      title: `${actionText} Mata Pelajaran`,
      message: `Apakah Anda yakin ingin ${actionText.toLowerCase()} mata pelajaran "${item.name}"?`,
      confirmText: isActivating ? "Ya, Aktifkan" : "Ya, Non-Aktifkan",
      confirmButtonClass: isActivating ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      // Eksekusi Service
      const res = await toggleSubjectStatus(item.id);
      showSuccess(res.message || "Status mata pelajaran berhasil diperbarui.");
      
      // Refresh Data Tabel & Stats Dashboard
      await loadData();
      getSubjectStatistics().then(setGlobalStats);
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengubah status mata pelajaran.");
    } finally {
      confirm.setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <Toast {...toast} onClose={hideToast} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Mata Pelajaran</h1>
            <p className="text-base text-gray-500 mt-1">Kelola master mapel dan jadikan Entry Point menuju Kurikulum dan Materi.</p>
          </div>
          <button
            onClick={() => { setSelectedSubject(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Daftarkan Mata Pelajaran
          </button>
        </div>

        {/* Dashboard Card Diperbarui */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PremiumStatCard title="Subject" value={globalStats.total_subjects} desc="Mata Pelajaran" icon={BookOpen} colorClass="bg-slate-50 text-slate-600" />
          <PremiumStatCard title="Curriculum" value={globalStats.total_curriculums} desc="Silabus Terstruktur" icon={Layers} colorClass="bg-purple-50 text-purple-700" />
          <PremiumStatCard title="Material" value={globalStats.total_materials} desc="Total Unggahan Modul" icon={FileText} colorClass="bg-blue-50 text-blue-700" />
          <PremiumStatCard title="Exam" value={globalStats.total_exams} desc="Bank Soal Aktif" icon={ClipboardCheck} colorClass="bg-green-50 text-green-700" />
        </div>

        <div className="bg-slate-50/70 p-3.5 border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[150px] max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.keyword}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                placeholder="Cari Kode / Nama Mapel..."
                className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {/* Filter Dinamis */}
            <select
              value={filters.education_level_id}
              onChange={(e) => setFilters(f => ({ ...f, education_level_id: e.target.value }))}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Jenjang</option>
              {educationLevels.map(lvl => (
                <option key={lvl.id} value={lvl.id}>{lvl.display_name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="1">Aktif</option>
              <option value="0">Non-Aktif</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setFilters({keyword:"", status:"", education_level_id:""})} className="p-2 text-gray-500 bg-white border border-gray-200 rounded-xl"><RotateCcw size={16}/></button>
            <button onClick={() => loadData()} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"><RefreshCw size={14}/> Refresh</button>
          </div>
        </div>

       <SubjectTable 
            subjects={subjects}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) =>
                setPagination((prev) => ({
                    ...prev,
                    page,
                }))
            }
            onPreview={handleView}
            onEdit={handleEdit}
            // onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}/>
    

        <SubjectModal 
            open={modalOpen} 
            onClose={() => setModalOpen(false)} 
            data={selectedSubject} 
            onSubmit={handleSubmit} 
            loading={loading} />

        <SubjectPreview 
            subject={previewSubject} 
            onClose={() => setPreviewSubject(null)} />
      </div>
    </div>
  );
}