import { useEffect, useState, useMemo, useCallback } from "react";
import { Layers, Laptop, Home, Building2, Plus, Search, RotateCcw, RefreshCw } from "lucide-react";
import PremiumStatCard from "../../../components/ui/StatCard";
import ClassTable from "../../../components/admin/academic/classes/ClassTable";
import ClassPreview from "../../../components/admin/academic/classes/ClassPreview";
import ClassWizardModal from "../../../components/admin/academic/classes/ClassWizardModal";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import useDebounce from "@/hooks/useDebounce";
import { 
  getClasses, getClass, updateClass, createClass, syncClassStudents, getClassSummary,
  toggleClassStatus, updateClassProgressStatus, duplicateClass, updateClassSubjects,updateClassTentors
} from "../../../services/academic/classService";
import { DEFAULT_CLASS_FILTER } from "../../../components/constants/class.constants";
import ClassStudentModal from "../../../components/admin/academic/classes/ClassStudentModal";
import ClassSubjectModal from "../../../components/admin/academic/classes/ClassSubjectModal";
import ClassTentorModal from "../../../components/admin/academic/classes/ClassTentorModal";

export default function ClassPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [summary, setSummary] = useState({ total: 0, reguler: 0, private: 0, online: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [tentorModalOpen, setTentorModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [previewClass, setPreviewClass] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const confirm = useConfirm();
  const [filters, setFilters] = useState(DEFAULT_CLASS_FILTER);
  const keyword = useDebounce(filters.keyword, 500);
  
  const [pagination, setPagination] = useState({
      page: 1, perPage: 10, from: 0, to: 0, total: 0, lastPage: 1,
  });

  const query = useMemo(() => ({
    keyword,
    status_active: filters.status,
    class_type: filters.class_type,
    display_name: filters.display_name,
    page: pagination.page,
    perPage: pagination.perPage,
  }), [keyword, filters.class_type, filters.display_name, filters.status, pagination.page, pagination.perPage]);

  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await getClassSummary();
      if (summaryData) setSummary(summaryData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getClasses(params);
      const { data, meta } = response.data;
      setClasses(data);
      setPagination(prev => ({
        ...prev,
        page: meta.current_page,
        from: meta.from,
        to: meta.to,
        total: meta.total,
        lastPage: meta.last_page,
        perPage: meta.per_page,
      }));
    } catch (err) {
      showError("Gagal Memuat Data Classes.");
    } finally {
      setLoading(false);
    }
  }, [query, showError]);

  useEffect(() => {
    loadData();
    loadSummary();
  }, []);

  useEffect(() => {
    loadData();
  }, [query]);

  const handleRefreshAll = async () => {
    await Promise.all([loadData(), loadSummary()]);
  };

  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      if (selectedClass) {
        await updateClass(selectedClass.id, form);
        showSuccess("Berhasil memperbarui data kelas.");
      } else {
        await createClass(form);
        showSuccess("Berhasil membuat kelas baru.");
      }
      await handleRefreshAll();
      setModalOpen(false);
    } catch (err) {
      showError(err.response?.data?.message || "Gagal menyimpan data kelas.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await toggleClassStatus(item.id);
      showSuccess("Status keaktifan kelas berhasil diubah.");
      await handleRefreshAll();
    } catch (err) {
      showError("Gagal mengubah status keaktifan kelas.");
    }
  };

  const handleDuplicate = async (item) => {
    try {
      await duplicateClass(item.id);
      showSuccess(`Kelas "${item.name}" berhasil diduplikasi.`);
      await handleRefreshAll();
    } catch (err) {
      showError("Gagal menduplikasi kelas.");
    }
  };

  const handleChangeProgressStatus = async (item, status) => {
    try {
      await updateClassProgressStatus(item.id, status);
      showSuccess(`Status progress kelas diubah menjadi ${status}.`);
      await handleRefreshAll();
    } catch (err) {
      showError("Gagal mengubah progress status.");
    }
  };

  const handleSaveStudents = async (payload) => {
    const classId = payload.class_id || payload.id;
    const studentIds = payload.student_ids || payload;

    try {
      setLoading(true);
      const res = await syncClassStudents(classId, studentIds);
      const updatedClass = res.data?.data || res.data;

      showSuccess("Daftar siswa kelas berhasil diperbarui.");
      setStudentModalOpen(false);

      // Refresh state lokal
      if (updatedClass) {
        setSelectedClass(updatedClass);
        if (previewClass) setPreviewClass(updatedClass);
      }

      await handleRefreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal memperbarui siswa kelas.");
    } finally {
      setLoading(false);
    }
  };


  const handleSaveSubjects = async (payload) => {
    const classId = payload.class_id || payload.id;
    const subjects = payload.subjects || [];

    try {
      setLoading(true);
      const res = await updateClassSubjects(classId, subjects);
      const updatedClass = res.data?.data || res.data;

      showSuccess("Daftar mata pelajaran kelas berhasil diperbarui.");
      setSubjectModalOpen(false);

      // Refresh state lokal
      if (updatedClass) {
        setSelectedClass(updatedClass);
        if (previewClass) setPreviewClass(updatedClass);
      }

      await handleRefreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal memperbarui mata pelajaran kelas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTentors = async (payload) => {
    const classId = payload.class_id || payload.id;
    const assignments = payload.assignments || [];

    try {
      setLoading(true);
      const res = await updateClassTentors(classId, assignments);
      const updatedClass = res.data?.data || res.data;

      showSuccess("Plotting tentor pengampu berhasil diperbarui.");
      setTentorModalOpen(false);

      // Refresh state lokal
      if (updatedClass) {
        setSelectedClass(updatedClass);
        if (previewClass) setPreviewClass(updatedClass);
      }

      await handleRefreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal memperbarui tentor pengampu kelas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <Toast {...toast} onClose={hideToast} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Class Management</h1>
            <p className="text-base text-gray-500 mt-1">Kelola rombel belajar, tipe kelas, penugasan tentor, dan geotagging absensi.</p>
          </div>
          <button onClick={() => { setSelectedClass(null); setModalOpen(true); }} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer">
            <Plus size={16} /> Tambah Class Baru
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PremiumStatCard title="Total Class" value={summary.total} desc="Terdaftar di Sistem" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
          <PremiumStatCard title="Private" value={summary.private} desc="Privat Datang ke Rumah" icon={Home} colorClass="bg-blue-50 text-blue-600" />
          <PremiumStatCard title="Online" value={summary.online} desc="Kelas Daring / Zoom" icon={Laptop} colorClass="bg-purple-50 text-purple-600" />
          <PremiumStatCard title="Reguler" value={summary.reguler} desc="Tatap Muka di Gedung Bimbel" icon={Building2} colorClass="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="bg-slate-50/70 p-3.5 border border-slate-100 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari nama kelas..." value={filters.keyword || ""} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs" />
            </div>

            <select value={filters.class_type || ""} onChange={(e) => setFilters({ ...filters, class_type: e.target.value })} className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white cursor-pointer">
              <option value="">Semua Jenis</option>
              <option value="REGULER">Reguler</option>
              <option value="PRIVATE">Private</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setFilters(DEFAULT_CLASS_FILTER)} className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl cursor-pointer" title="Reset Filter">
              <RotateCcw size={16} />
            </button>
            <button onClick={handleRefreshAll} disabled={loading} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        <ClassTable 
          classes={classes}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPreview={(item) => setPreviewClass(item)}
          onEdit={(item) => { setSelectedClass(item); setModalOpen(true); }}
          onToggleStatus={handleToggleStatus}
          onDuplicate={handleDuplicate}
          onChangeProgressStatus={handleChangeProgressStatus}
        />

        <ClassWizardModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSubmit={handleSubmit} 
          loading={loading} 
          initialData={selectedClass}
        />

        <ClassPreview
          open={!!previewClass}
          classData={previewClass}
          onClose={() => setPreviewClass(null)}
          onEdit={(c) => { setSelectedClass(c); setModalOpen(true); }}
          onManageStudents={(c) => {
            setSelectedClass(c);
            setStudentModalOpen(true);
          }}
          onManageSubjects={(c) => {
            setSelectedClass(c);
            setSubjectModalOpen(true);
          }}
          onManageTentors={(c) => {
            setSelectedClass(c);
            setTentorModalOpen(true);
          }}
        />

        <ClassSubjectModal
          open={subjectModalOpen}
          onClose={() => setSubjectModalOpen(false)}
          classData={previewClass || selectedClass}
          // onSave={handleSaveSubjects}
          onSubmit={handleSaveSubjects}
          loading={loading}
        />

        <ClassTentorModal
          open={tentorModalOpen}
          onClose={() => setTentorModalOpen(false)}
          classData={selectedClass}
          onSubmit={handleSaveTentors}
          loading={loading}
        />

        <ClassStudentModal
          open={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          classData={selectedClass}
          onSubmit={handleSaveStudents}
          loading={loading}
        />
      </div>
    </div>
  );
}