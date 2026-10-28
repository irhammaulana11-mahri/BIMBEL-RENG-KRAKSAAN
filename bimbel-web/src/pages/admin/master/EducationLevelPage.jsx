import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search,RotateCcw,RefreshCw,BookOpen,FileText,ClipboardCheck } from "lucide-react";
import EducationLevelTable from "../../../components/admin/master/education-level/EducationLevelTable";
import EducationLevelModal from "../../../components/admin/master/education-level/EducationLevelModal";
import PremiumStatCard from "../../../components/ui/StatCard"
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import useDebounce from "../../../hooks/useDebounce";
import {
  getEducationLevels,
  createEducationLevel,
  updateEducationLevel,
  toggleEducationLevelStatus
} from "../../../services/admin/educationLevelService";
import { DEFAULT_EDUCATIONLEVEL_FILTER } from "../../../components/constants/educationLevel.constants";


export default function EducationLevelPage() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [filters, setFilters] = useState(DEFAULT_EDUCATIONLEVEL_FILTER);

    // State Pagination Dinamis
  const [pagination, setPagination] = useState({
      page: 1,
      perPage: 10,
      from: 0,
      to: 0,
      total: 0,
      lastPage: 1,
    });

  const updateFilter = useCallback((field, value) => {
      setFilters((prev) => ({
          ...prev,
          [field]: value,
      }));
    }, []);

  const statistics = {
    totalSubjects : levels.length,
    activeSubjects : levels.filter((s) => s.is_active === true).length,
    inactiveSubjects : levels.filter((s) => s.is_active === false).length,
  };

  const query = useMemo(() => ({
      keyword,
      status: filters.status,
      page: pagination.page,
      perPage: pagination.perPage,
    }), [keyword,filters,pagination.page,pagination.perPage,]);


  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getEducationLevels(params);

      const {data,meta} = response.data;
      setLevels(data);
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
      console.error(err);
      showError("Gagal Memuat Data Level dan Grade.");
    } finally {
      setLoading(false);
    }
  }, [query,showError]);


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [query]);


  // Reset Filter ke Default
  const handleResetFilter = () => {
    setFilters(DEFAULT_EDUCATIONLEVEL_FILTER);
    setPagination((prev) => ({
        ...prev,
        page: 1,
    }));
  };

  useEffect(() => {
    setPagination((prev) => {
        if (prev.page === 1) return prev;
        return {
            ...prev,
            page: 1,
        };
    });
  }, [keyword,filters]); 


  const handleRefresh = () => {
    loadData();
  };


  const handleAdd = () => {
    setSelectedData(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedData(item);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
      try {
        setLoading(true);
        if (selectedData) {
            await updateEducationLevel(selectedData.id, form);
            showSuccess("Berhasil Memperbaharui Data Jenjang dan Tingkatan.");
        } else {
            await createEducationLevel(form);
            showSuccess("Berhasil Membuat Data Jenjang dan Tingkatan.");
        }
        setModalOpen(false);
        await loadData();
      } catch (err) {
        showError("Gagal Membuat/Memperbarui Data Jenjang dan Tingkatan");
      } finally {
        setLoading(false);
      }
    };
  

  const handleToggleStatus = async (item) => {
    // Validasi Frontend agar user tidak perlu menunggu respon error dari server
    if (item.is_active) {
      const { subjects, packages, classes } = item.usage_count;
      if (subjects > 0 || packages > 0 || classes > 0) {
        showError(`Education Level ini masih digunakan oleh ${subjects} Subject, ${packages} Package, ${classes} Class. Tidak dapat dinonaktifkan.`);
        return; // Hentikan eksekusi
      }
    }

    try {
      await toggleEducationLevelStatus(item.id);
      showSuccess(`Status ${item.display_name} berhasil ${item.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`);
      loadData();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengubah status.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      <Toast {...toast} onClose={hideToast} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Jenjang & Tingkatan Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola daftar jenjang dan tingkatan kelas pendidikan.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus size={16} /> Tambah Jenjang
        </button>
      </div>

      {/* Row Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Mata Pelajaran" value={statistics.totalSubjects} desc="Silabus Aktif terdaftar" icon={BookOpen} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Total Materi Terunggah" value={statistics.totalMaterials} desc="E-Book PDF Perlindungan Paket" icon={FileText} colorClass="bg-blue-50 text-blue-700" />
        <PremiumStatCard title="Total Bank Ujian" value={statistics.totalExams} desc="Multiple Choice & Essay Terbit" icon={ClipboardCheck} colorClass="bg-green-50 text-green-700" />
      </div>

      {/* Toolbars */}
      <div className="bg-slate-70/70 p-3.5 border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* SISI KIRI */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">

          <div className="relative flex-1 min-w-[150px] max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.keyword || ""}
              onChange={(e) => updateFilter("keyword", e.target.value)}
              placeholder="Cari Kode / Jenjang / Jenjang..."
              className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
            />
          </div>

          <div className="hidden sm:block h-6 w-px bg-gray-200 my-auto" />
            <select
              value={filters.status || ""}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 transition-all shadow-2xs cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="1">Aktif</option>
              <option value="0">Non-Aktif</option>
            </select>
        </div>

          {/* SISI KANAN: UTILITY BUTTONS (Reset & Refresh) */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-gray-200/60 justify-end">
          {/* Tombol Reset */}
          <button
            type="button"
            onClick={handleResetFilter}
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-2xs"
            title="Reset Seluruh Filter"
          >
            <RotateCcw size={16} />
          </button>

          {/* Tombol Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs disabled:bg-blue-300 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <EducationLevelTable 
        data={levels} 
        loading={loading} 
        pagination={pagination}
        onPageChange={(page, perPage) =>
              setPagination((prev) => ({
                  ...prev,
                  page,
                  ...(perPage ? { perPage } : {}),
              }))
          }
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      <EducationLevelModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedData}
        onSubmit={handleSubmit}
      />
    </div>
  </div>
  );
}