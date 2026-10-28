import { useEffect, useState,useMemo, useCallback } from "react";
import { getApiErrorMessage } from "@/utils/apiError";
import { Search, Users, UserCheck, UserMinus, GraduationCap, ShieldAlert,RotateCcw,RefreshCw, } from "lucide-react";
import { getParents, updateParent, deleteParent } from "../../../services/admin/parentService";
import ParentModal from "../../../components/admin/master/parent/ParentModal";
import ParentPreview from "../../../components/admin/master/parent/ParentPreview";
import ParentTable from "../../../components/admin/master/parent/ParentTable";
import PremiumStatCard from "../../../components/ui/StatCard"
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../components/utils/dateFormatter";
import useDebounce from "@/hooks/useDebounce";
import { DEFAULT_LEAD_FILTER } from "../../../components/constants/parent.constants";
import { useConfirm } from "@/components/ui/confirmation";



export default function ParentPage() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [previewParent, setPreviewParent] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [childFilter, setChildFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_LEAD_FILTER);
  const keyword = useDebounce(filters.keyword, 500);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const confirm = useConfirm();

  // State Pagination Dinamis
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    from: 0,
    to: 0,
    total: 0,
    lastPage: 1,
  });


  const statistic = {
    totalParents : pagination.total || parents.length,
    activeParents : parents.filter((p) => p.user?.is_active ?? true).length,
    totalStudents : parents.reduce((sum, p) => sum + (p.students_count || p.students?.length || 0), 0),
    noStudent : parents.filter((p) => (p.students_count || p.students?.length || 0) === 0).length,
  }

  const updateFilter = useCallback((field, value) => {
      setFilters((prev) => ({
          ...prev,
          [field]: value,
      }));
    }, []);



  const query = useMemo(() => ({
      keyword,
      status: filters.status,
      children: filters.children,
      page: pagination.page,
      perPage: pagination.perPage,
    }), [keyword,filters.status,filters.children,pagination.page,pagination.perPage,]);
  

  // 1. Memuat Data dari API
  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getParents(params);

      const {data,meta,} = response.data;
      setParents(data);
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
      showError("Gagal memuat data parents.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Reset Filter ke Default
  const handleResetFilter = () => {
    setFilters(DEFAULT_LEAD_FILTER);
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
  }, [keyword,filters.status]); 

  const handleRefresh = () => {
    loadData();
  };
  

  const handleEdit = (item) => {
    setSelectedParent(item);
    setModalOpen(true);
  };

  const handleView = (parent) => {
    setPreviewParent(parent);
  };

  
  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      if (selectedParent) await updateParent(selectedParent.id, form);
        await loadData();
        setModalOpen(false);
        showSuccess("Berhasil Memperbarui Data Orang Tua / Wali");
    } catch (err) {
      showError("Gagal Memperbarui Data Orang Tua / Wali");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      const ok = await confirm.delete({
        title: "Hapus Data Orang Tua / Wali",
        message: "Data Orang Tua / Wali akan dihapus permanen."
      });
  
      if (!ok) return;
  
      try {
        confirm.setLoading(true);
        const response = await deleteParent(id);
        showSuccess("Data Orang Tua / Wali berhasil dihapus.");
        await loadData();
      } catch (err) {
        showError(getApiErrorMessage(err, "Gagal menghapus data orang tua / wali."));
      } finally {
        confirm.setLoading(false);
      }
    };



  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">

      <Toast {...toast} onClose={hideToast} />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Wali Murid</h1>
          <p className="text-base text-gray-500 mt-1">
            Basis data resmi orang tua / wali murid yang akunnya telah aktif dari hasil peninjauan Page Lead.
          </p>
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Wali Murid" value={statistic.totalParents} desc="Telah Teraktivasi Sistem" icon={Users} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Wali Murid Aktif" value={statistic.activeParents} desc="Hak Akses Aplikasi Mobile ON" icon={UserCheck} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Belum Plot Anak" value={statistic.noStudent} desc="Perlu Input Data Murid" icon={ShieldAlert} colorClass="bg-amber-50 text-amber-700" />
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
              placeholder="Cari nama orang tua / wali..."
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
              <option value="true">Aktif</option>
              <option value="false">Non-aktif</option>
            </select>
            <select
              value={filters.children || ""}
              onChange={(e) => updateFilter("children", e.target.value)}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 transition-all shadow-2xs cursor-pointer"
            >
              <option value="">Semua Status Anak</option>
              <option value="yes">Sudah Plot Anak</option>
              <option value="no">Belum Plot Anak</option>
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

        {/* Tabel */}
        <ParentTable 
          parents={parents}
          loading={loading}
          pagination={pagination}
          onPageChange={(page, perPage) =>
              setPagination((prev) => ({
                  ...prev,
                  page,
                  ...(perPage ? { perPage } : {}),
              }))
          }
          onPreview={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}/>

      <ParentModal open={modalOpen} onClose={() => setModalOpen(false)} data={selectedParent} onSubmit={handleSubmit} loading={loading} />
      <ParentPreview parent={previewParent} onClose={() => setPreviewParent(null)} />
      </div>
    </div>
  );
}