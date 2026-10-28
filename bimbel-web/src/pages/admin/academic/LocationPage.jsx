import React, { useEffect, useState, useMemo, useCallback } from "react";
import { MapPin, CheckCircle2, Plus, Search, RotateCcw, RefreshCw, Layers } from "lucide-react";
import PremiumStatCard from "../../../components/ui/StatCard";
import LocationTable from "../../../components/admin/academic/location/LocationTable";
import LocationPreview from "../../../components/admin/academic/location/LocationPreview";
import LocationModal from "../../../components/admin/academic/location/LocationModal";
import { DEFAULT_LOCATION_FILTER } from "../../../components/constants/location.constants";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import useDebounce from "@/hooks/useDebounce";
import { 
  getLocations, 
  getLocation, 
  createLocation, 
  updateLocation, 
  toggleLocationStatus,
  getLocationSummary
} from "../../../services/admin/locationService";

export default function LocationPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Ringkasan Statistik Server
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    total_classes: 0,
  });

  // State Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [previewLocation, setPreviewLocation] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const confirm = useConfirm();

  const [filters, setFilters] = useState(DEFAULT_LOCATION_FILTER);
  const keyword = useDebounce(filters.keyword, 500);
  
  const [pagination, setPagination] = useState({
      page: 1,
      perPage: 10,
      from: 0,
      to: 0,
      total: 0,
      lastPage: 1,
  });

  const handleResetFilter = () => {
    setFilters(DEFAULT_LOCATION_FILTER);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const query = useMemo(() => ({
    keyword,
    status: filters.status,
    page: pagination.page,
    perPage: pagination.perPage,
  }), [keyword, filters.status, pagination.page, pagination.perPage]);

  // Load Summary Statistik Server
  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await getLocationSummary();
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (err) {
      console.error("Gagal memuat ringkasan lokasi:", err);
    }
  }, []);

  // Load Data Tabel Locations
  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getLocations(params);
      const { data, meta } = response.data;
      setLocations(data);
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
      showError("Gagal Memuat Data Lokasi.");
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
      if (selectedLocation) {
        await updateLocation(selectedLocation.id, form);
        showSuccess("Berhasil Memperbarui Data Lokasi Kelas.");
      } else {
        await createLocation(form);
        showSuccess("Berhasil Membuat Lokasi Kelas Baru.");
      }
      await handleRefreshAll();
      setModalOpen(false);
    } catch (err) {
      showError("Gagal Membuat/Memperbarui Data Lokasi Kelas.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Handler Toggle Status (Aktif / Non-Aktif) dengan Modal Konfirmasi
  const handleToggleStatus = async (loc) => {
    const isActivating = !(loc.is_active ?? true);
    const actionText = isActivating ? "Mengaktifkan" : "Menonaktifkan";

    const ok = await confirm.confirm({
      title: `${actionText} Lokasi Belajar`,
      message: `Apakah Anda yakin ingin ${actionText.toLowerCase()} gedung/lokasi "${loc.location_name}"?`,
      confirmText: isActivating ? "Ya, Aktifkan" : "Ya, Non-Aktifkan",
      confirmButtonClass: isActivating ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      await toggleLocationStatus(loc.id);
      showSuccess(`Status keaktifan gedung "${loc.location_name}" berhasil diperbarui.`);
      await handleRefreshAll();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengubah status keaktifan lokasi.");
    } finally {
      confirm.setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedLocation(item);
    setModalOpen(true);
  };

  const handleView = async (location) => {
    try {
      const response = await getLocation(location.id);
      setPreviewLocation(response.data?.data || response.data);
    } catch (err) {
      setPreviewLocation(location);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <Toast {...toast} onClose={hideToast} />

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Lokasi Belajar</h1>
            <p className="text-base text-gray-500 mt-1">Atur titik koordinat pusat gedung bimbel dan radius absensi fisik untuk kelas reguler.</p>
          </div>
          <button
            onClick={() => { setSelectedLocation(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus size={16} /> Tambah Lokasi Baru
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PremiumStatCard title="Total Cabang Gedung" value={summary.total} desc="Gedung Terdaftar" icon={MapPin} colorClass="bg-slate-50 text-slate-600" />
          <PremiumStatCard title="Cabang Aktif" value={summary.active} desc="Siap Digunakan Jadwal" icon={CheckCircle2} colorClass="bg-green-50 text-green-600" />
          <PremiumStatCard title="Kelas Terikat" value={summary.total_classes} desc="Aktif Berjalan" icon={Layers} colorClass="bg-purple-50 text-purple-600" />
        </div>

        {/* Toolbar Filter */}
        <div className="bg-slate-50/70 p-3.5 border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6 rounded-xl">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode, nama lokasi, atau alamat..."
                value={filters.keyword || ""}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full border border-gray-200/80 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleResetFilter}
              className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabel Lokasi */}
        <LocationTable 
          locations={locations}
          loading={loading}
          pagination={pagination}
          onPageChange={(page, perPage) => setPagination((prev) => ({ ...prev, page, ...(perPage ? { perPage } : {}) }))}
          onPreview={handleView}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Modal Form Tambah / Edit */}
        <LocationModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          data={selectedLocation} 
          onSubmit={handleSubmit} 
          loading={loading} 
        />

        {/* Drawer Preview Detail Lokasi Multi-Tab */}
        <LocationPreview
          open={!!previewLocation}
          location={previewLocation}
          onClose={() => setPreviewLocation(null)}
          onEdit={handleEdit}
        />

      </div>
    </div>
  );
}