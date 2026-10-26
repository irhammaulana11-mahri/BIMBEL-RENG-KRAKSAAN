import { useEffect, useState, useMemo, useCallback } from "react";
import { Users, UserCheck, Plus, Search, RotateCcw, RefreshCw, BookX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PremiumStatCard from "../../../components/ui/StatCard";
import TentorTable from "../../../components/admin/master/tentor/TentorTable";
import TentorPreview from "../../../components/admin/master/tentor/TentorPreview";
import PlotSubjectModal from "../../../components/admin/master/tentor/PlotSubjectModal";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import useDebounce from "@/hooks/useDebounce";
import { 
  getTentors, 
  getTentor, 
  updateTentor, 
  toggleTentorStatus,
  getTentorSummary 
} from "../../../services/admin/tentorService";
import { DEFAULT_TENTOR_FILTER } from "../../../components/constants/tentor.constants";

export default function TentorPage() {
  const navigate = useNavigate();
  const [tentors, setTentors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Modals & Drawer
  const [openPlotModal, setOpenPlotModal] = useState(false);
  const [selectedTentor, setSelectedTentor] = useState(null);
  const [previewTentor, setPreviewTentor] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const confirm = useConfirm();

  const [filters, setFilters] = useState(DEFAULT_TENTOR_FILTER);
  const keyword = useDebounce(filters.keyword, 500);
  
  const [pagination, setPagination] = useState({
      page: 1,
      perPage: 10,
      from: 0,
      to: 0,
      total: 0,
      lastPage: 1,
  });

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    unplotted: 0,
  });

  const query = useMemo(() => ({
    keyword,
    status: filters.status,
    specialization: filters.specialization,
    page: pagination.page,
    perPage: pagination.perPage,
  }), [keyword, filters.status, filters.specialization, pagination.page, pagination.perPage]);

  const handleResetFilter = () => {
    setFilters(DEFAULT_TENTOR_FILTER);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await getTentorSummary();
      if (summaryData) {
        setSummary({
          total: summaryData.total || 0,
          active: summaryData.active || 0,
          inactive: summaryData.inactive || 0,
          unplotted: summaryData.unplotted || 0,
        });
      }
    } catch (err) {
      console.error("Gagal mengambil data ringkasan statistik tentor:", err);
    }
  }, []);
  
  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getTentors(params);
      const { data, meta } = response.data;
      setTentors(data);
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
      showError("Gagal Memuat Data Tentor.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { loadData(); loadSummary();}, []);
  useEffect(() => { loadData(); }, [query]);

  // const statistic = useMemo(() => ({
  //   total: pagination.total || tentors.length,
  //   active: tentors.filter((t) => t.user?.is_active ?? t.is_active).length,
  //   unplotted: tentors.filter((t) => !t.subjects || t.subjects.length === 0).length,
  // }), [tentors, pagination.total]);

  // 🟢 Handler Simpan Profile Inline dari Drawer
  const handleSaveProfile = async (id, formData) => {
    try {
      setLoading(true);
      await updateTentor(id, formData);
      showSuccess("Profil tentor berhasil diperbarui.");
      
      // Refresh Data Tabel & Detail Drawer
      await loadData();
      const updated = await getTentor(id);
      setPreviewTentor(updated.data?.data || updated.data);
    } catch (err) {
      showError(err.response?.data?.message || "Gagal memperbarui profil tentor.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Handler Toggle Status (Aktif / Non-Aktif) dengan Modal Konfirmasi
  const handleToggleStatus = async (item) => {
    const isActivating = !(item.user?.is_active ?? item.is_active);
    const actionText = isActivating ? "Mengaktifkan" : "Menonaktifkan";

    const ok = await confirm.confirm({
      title: `${actionText} Akses Tentor`,
      message: `Apakah Anda yakin ingin ${actionText.toLowerCase()} akses mengajar tentor "${item.name || item.user?.name}"?`,
      confirmText: isActivating ? "Ya, Aktifkan" : "Ya, Non-Aktifkan",
      confirmButtonClass: isActivating ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      await toggleTentorStatus(item.id);
      showSuccess("Status keaktifan tentor berhasil diperbarui.");
      await loadData();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengubah status tentor.");
    } finally {
      confirm.setLoading(false);
    }
  };

  const handleView = async (tentor) => {
    try {
      const response = await getTentor(tentor.id);
      setPreviewTentor(response.data?.data || response.data);
    } catch (err) {
      setPreviewTentor(tentor);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <Toast {...toast} onClose={hideToast} />

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Tentor Management</h1>
            <p className="text-base text-gray-500 mt-1">Kelola data tenaga pengajar (tentor), spesialisasi, dan pengampuan mata pelajaran.</p>
          </div>
          <button
            onClick={() => navigate("/admin/tentors/new")}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Tambah Tentor Baru
          </button>
        </div>

        {/* 🟢 Stat Cards (Menggunakan Nilai dari summary state API) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PremiumStatCard 
            title="Total Tentor" 
            value={summary.total} 
            desc="Terdaftar di Sistem" 
            icon={Users} 
            colorClass="bg-slate-50 text-slate-600" 
          />
          <PremiumStatCard 
            title="Tentor Aktif" 
            value={summary.active} 
            desc="Dapat Di-plotting Sesi" 
            icon={UserCheck} 
            colorClass="bg-green-50 text-green-600" 
          />
          <PremiumStatCard 
            title="Belum Diplot Mapel" 
            value={summary.unplotted} 
            desc="Perlu Sinkronisasi Mapel" 
            icon={BookX} 
            colorClass="bg-amber-50 text-amber-600" 
          />
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50/70 p-3.5 border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[150px] max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau spesialisasi..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>

            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Semua Spesialisasi</option>
              <option value="SAINTEK">Saintek (IPA/MTK/Sains)</option>
              <option value="SOSHUM">Soshum (IPS/Sosial)</option>
              <option value="BAHASA">Bahasa & Literasi</option>
              <option value="UMUM">Umum / Semua Jenjang</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleResetFilter}
              className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabel Utama */}
        <TentorTable 
          tentors={tentors}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPreview={handleView}
          onToggleStatus={handleToggleStatus}
        />

        {/* Drawer Preview dengan Form Inline di Tab Overview */}
        <TentorPreview
          open={!!previewTentor}
          tentor={previewTentor}
          onClose={() => setPreviewTentor(null)}
          onSaveProfile={handleSaveProfile}
          onPlotSubject={(t) => {
            setSelectedTentor(t);
            setOpenPlotModal(true);
          }}
          loading={loading}
        />

        {/* Modal Plotting Subject */}
        <PlotSubjectModal 
          open={openPlotModal} 
          tentor={selectedTentor} 
          onClose={() => setOpenPlotModal(false)}
          onSuccess={(id) => {
            loadData();
            if (previewTentor?.id === id) {
              getTentor(id).then(res => setPreviewTentor(res.data?.data || res.data));
            }
          }}
        />
      </div>
    </div>
  );
}