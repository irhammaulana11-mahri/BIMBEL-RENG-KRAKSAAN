import { useEffect, useState, useMemo, useCallback } from "react";
import { UserPlus, CheckCircle, Clock, AlertCircle, RefreshCw, Search, RotateCcw, Calendar, Calendar as CalendarIcon } from "lucide-react";
import { getLeads, deleteLead, convertLead } from "../../../services/admin/leadService";
import LeadDetailModal from "../../../components/admin/website/lead/LeadDetailModal";
import PremiumStatCard from "../../../components/ui/StatCard";
import LeadTable from "../../../components/admin/website/lead/LeadTable";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { formatDate } from "../../../components/utils/dateFormatter";
import useDebounce from "@/hooks/useDebounce";
import { DEFAULT_LEAD_FILTER } from "../../../components/constants/lead.constants";

export default function LeadPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openModal, setOpenModal] = useState(false);  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const confirm = useConfirm();
  const [periodType, setPeriodType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState("");
  // State Filter Utama
  const [filters, setFilters] = useState(DEFAULT_LEAD_FILTER);
  const keyword = useDebounce(filters.keyword, 500);
  
  // State Pagination Dinamis
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
    new: 0,
    contacted: 0,
    registered: 0,
  });

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({
        ...prev,
        [field]: value,
    }));
  }, []);


  const handlePeriodChange = (period) => {
    setPeriodType(period);
    setSelectedDate("");
  };


  const handleDateChange = (value) => {

    setSelectedDate(value);

    updateFilter("period", periodType);
    updateFilter("date", value);

  };

  
  const query = useMemo(() => ({
    keyword,
    status: filters.status,
    period: filters.period,
    date: filters.date,
    page: pagination.page,
    perPage: pagination.perPage,
  }), [keyword,filters.status,filters.period,filters.date,pagination.page,pagination.perPage,]);


  // 1. Memuat Data dari API
  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getLeads(params);

      const {data,meta,summary,} = response.data;
      setLeads(data);
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
      showError("Gagal memuat data lead.");
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
  }, [keyword,filters.status,filters.period,filters.date,filters.startDate,filters.endDate,]);

  // Kalkulasi Statistik StatCard
  const statistic = useMemo(() => ({
    totalLead: leads.length,
    newLead: leads.filter((x) => x.status === "NEW").length,
    contactedLead: leads.filter((x) => x.status === "CONTACTED").length,
    registeredLead: leads.filter((x) => x.status === "REGISTERED").length,
  }), [leads]);

  // Handler Aksi Table
  const handleView = (item) => {
    setSelected(item);
    setOpenModal(true);
  };

  const handleConvert = async (id) => {
    const ok = await confirm.activate({
      title: "Setujui Pendaftaran?",
      message: "Akun Parent akan dibuat, pastikan sudah callback parent."
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      const response = await convertLead(id);
      showSuccess(`Akun berhasil dibuat. Password sementara : ${response.data.temporary_password}`);
      await loadData();
    } catch (err) {
      showError(err.response?.data?.message ?? "Gagal memproses persetujuan.");
    } finally {
      confirm.setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({
      title: "Hapus Data Lead",
      message: "Lead akan dihapus permanen."
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      const response = await deleteLead(id);
      showSuccess(response.data?.message || "Data berhasil dihapus.");
      await loadData();
    } catch (err) {
      showError(err.response?.data?.message ?? "Gagal menghapus data.");
    } finally {
      confirm.setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      
      {/* Toast Notification */}
      <Toast {...toast} onClose={hideToast} />

      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Leads Admission Management</h1>
          <p className="text-base text-gray-500 mt-1">Tinjau formulir masuk website, hubungi wali murid via WA, dan lakukan aktivasi akun master.</p>
        </div>
      </div>

      {/* 2. Row Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PremiumStatCard title="Total Pengajuan" value={statistic.totalLead} desc="Masuk Seluruh Periode" icon={UserPlus} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Antrean Baru (NEW)" value={statistic.newLead} desc="Perlu Segera Ditinjau" icon={Clock} colorClass="bg-blue-50 text-blue-600" />
        <PremiumStatCard title="Sudah Dihubungi" value={statistic.contactedLead} desc="Tahap Follow Up WA" icon={AlertCircle} colorClass="bg-amber-50 text-amber-600" />
        <PremiumStatCard title="Teraktivasi (Parent)" value={statistic.registeredLead} desc="Resmi Menjadi Murid" icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
      </div>

      {/* 3. BARIS FILTER STANDARISASI DENGAN LAYOUT KONSEP PRO */}
      <div className="bg-slate-70/70 p-3.5 border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* SISI KIRI: SEARCH & MIKRO FILTER */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
          {/* 1. Primary Input: Search Bar (Diperlebar agar menonjol) */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama wali atau murid..."
              value={filters.keyword || ""}
              onChange={(e) => updateFilter("keyword", e.target.value)}
              className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
            />
          </div>

          {/* Divider Halus */}
          <div className="hidden sm:block h-6 w-px bg-gray-200 my-auto" />

          {/* 2. Status Filter Dropdown */}
          <select
            value={filters.status || ""}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 transition-all shadow-2xs cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="NEW">✨ NEW (Baru)</option>
            <option value="CONTACTED">💬 CONTACTED</option>
            <option value="REGISTERED">✅ REGISTERED</option>
          </select>

          <div className="flex bg-gray-200 p-1 rounded-xl shrink-0">
          </div>
          {/* 3. Segmented Toggle Periode + Date Picker */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() =>  handlePeriodChange("daily")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    periodType === "daily"
                        ? "bg-white text-gray-800 shadow-xs"
                        : "text-gray-500"
                }`}
            >
                Harian
            </button>

            <button
                type="button"
                onClick={() => handlePeriodChange("monthly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    periodType === "monthly"
                        ? "bg-white text-gray-800 shadow-xs"
                        : "text-gray-500"
                }`}
            >
                Bulanan
            </button>

            </div>
            {periodType === "daily" ? (
              <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-xl border px-4 py-2.5 text-sm bg-white"
              />
            ) : (
              <input
                  type="month"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-xl border px-4 py-2.5 text-sm bg-white"
              />

          )}
          </div>
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

      {/* 4. Tabel Data Lead */}
      <LeadTable
          leads={leads}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) =>
              setPagination((prev) => ({
                  ...prev,
                  page,
              }))
          }
          onView={handleView}
          onConvert={handleConvert}
          onDelete={handleDelete}
          formatDate={formatDate}
      />

      {/* 5. Footer Pagination Dinamis
      <div className="border-t border-gray-100 pt-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
          <p className="text-gray-600 font-medium">
            Menampilkan <span className="text-gray-900 font-bold">{pagination.from}</span> - <span className="text-gray-900 font-bold">{pagination.to}</span> dari <span className="text-gray-900 font-bold">{pagination.total}</span> data lead
          </p>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white font-bold hover:bg-gray-50 disabled:opacity-40 transition-all text-sm"
            >
              Prev
            </button>
            
            <span className="px-4 py-2 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-xs">
              {pagination.page}
            </span>

            <button 
              disabled={pagination.page >= pagination.lastPage || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white font-bold hover:bg-gray-50 disabled:opacity-40 transition-all text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div> */}

      {/* Modal Detail Lead */}
      <LeadDetailModal 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        data={selected} 
        onSuccess={loadData} 
      />
    </div>
  </div>
  );
}