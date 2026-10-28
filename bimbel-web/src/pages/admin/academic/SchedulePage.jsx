import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, CalendarDays, Table, LayoutList } from "lucide-react";
import api from "@/api/axios";

// 🟢 Reusable Views
import SessionTable from "../../../components/admin/academic/schedule/views/SessionTable";
import SessionTimeline from "../../../components/admin/academic/schedule/views/SessionTimeline";
import SessionWeek from "../../../components/admin/academic/schedule/views/SessionWeek";
import ScheduleWizardModal from "../../../components/admin/academic/schedule/ScheduleWizardModal";

// 🟢 Drawers & Modals (Dipisah berdasarkan entitas)
import SessionPreview from "../../../components/admin/academic/schedule/SessionPreview";
import MasterPreview from "../../../components/admin/academic/schedule/MasterPreview";
import EditPatternModal from "../../../components/admin/academic/schedule/EditPatternModal";
import { getSchedules,getSessions,toggleScheduleStatus } from "@/services/academic/scheduleService";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";

export default function SchedulePage() {
  const [dataSource, setDataSource] = useState("session"); 
  const [viewMode, setViewMode] = useState("table"); 
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  // 🟢 Tambahkan page dan perPage ke default filter
  const [filters, setFilters] = useState({ keyword: "", status: "", page: 1, perPage: 15 });

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [pagination, setPagination] = useState({ 
      page: 1, 
      perPage: 15,
      from: 0,
      to: 0,
      total: 0,
      lastPage: 1,
    });

  // 🟢 State terpisah untuk menampung data yang sedang di-klik
  const [selectedSession, setSelectedSession] = useState(null); 
  const [selectedMaster, setSelectedMaster] = useState(null); 
  const [isEditPatternOpen, setIsEditPatternOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = dataSource === "session" ? getSessions(filters) : getSchedules(filters);
      const res = await endpoint;
      const metaResponse = res.data?.meta || res.data;
      setPagination((prev) => ({
        ...prev,
        page: metaResponse?.current_page || 1,
        perPage: metaResponse?.per_page || 15,
        from: metaResponse?.from || 0,
        to: metaResponse?.to || 0,
        total: metaResponse?.total || 0,         // 🟢 Sekarang total akan terbaca (misal: 4)
        lastPage: metaResponse?.last_page || 1,
      }));
      
      const rawData = res.data?.data || [];
      // NORMALISASI DATA (Agar bisa dibaca oleh SessionTable/Timeline)
      const normalizedData = rawData.map((item) => ({
        ...item,
        class_name: item.class_name || item.classroom?.class_name || item.classroom?.name || "-",
        class_type: (item.class_type || item.classroom?.class_type)?.toUpperCase() || "REGULER",
        subject_name: item.subject_name || item.subject?.subject_name || item.subject?.name || "-",
        tentor_name: item.tentor_name || item.tentor?.user?.name || item.tentor?.tentor_name || item.tentor?.name || "Belum Diplot",
        // Label lokasi mengikuti jenis kelas: Online / Rumah <siswa> / Gedung bimbel (+ ruang)
        room_name: item.location_label
          || ({ ONLINE: "Online", PRIVATE: "Rumah siswa" }[(item.class_type || item.classroom?.class_type || "").toUpperCase()])
          || [item.location?.location_name || item.location_name, item.room_name].filter(v => v && v !== "-").join(" • ")
          || "Lokasi belum diatur",
        start_time: item.start_time?.substring(0, 5),
        end_time: item.end_time?.substring(0, 5),
        session_date: item.session_date || item.day_of_week, // Fallback day_of_week untuk Master
        status: item.status || (item.is_active ? "ACTIVE" : "INACTIVE"),
        reason: item.reason || item.note || null,
        note: item.note || null,

      }));

      setData(normalizedData);
      
      // Auto-update Preview jika sedang terbuka
      setSelectedSession((prev) => {
        if (!prev) return null;
        return normalizedData.find(item => item.id === prev.id) || prev;
      });
      
      setSelectedMaster((prev) => {
        if (!prev) return null;
        return normalizedData.find(item => item.id === prev.id) || prev;
      });
    } catch (error) {
      showError("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [dataSource, filters,pagination.page, pagination.perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🟢 Fungsi Penyalur (Router) saat baris/item di-klik
  const handleSelectRow = (item) => {
    if (dataSource === "session") {
      setSelectedSession(item);
    } else {
      setSelectedMaster(item);
    }
  };

  // Fungsi Toggle Status Master
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleScheduleStatus(id, !currentStatus);
      showSuccess(`Status Master berhasil diubah menjadi ${!currentStatus ? "Aktif" : "Nonaktif"}.`);
      fetchData(); // Refresh tabel seketika
    } catch (error) {
      showError("Gagal mengubah status", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <Toast {...toast} onClose={hideToast} />
      {/* HEADER & TOGGLE DATA SOURCE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Jadwal</h1>
          <p className="text-sm text-gray-500 mt-1">Pusat kontrol operasional sesi kelas dan absensi KBM.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => { setDataSource("session"); setFilters({ keyword: "", status: "" }); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                dataSource === "session" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Agenda Session
            </button>
            <button
              onClick={() => { setDataSource("master"); setFilters({ keyword: "", status: "" }); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                dataSource === "master" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Master Jadwal
            </button>
          </div>

          <button 
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} /> Auto-Generate Jadwal
          </button>
        </div>
      </div>

      {/* TOOLBAR: FILTERS & VIEWS */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kelas, subject, tentor..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
          {dataSource === "session" && (
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-200/80 p-0.5 rounded-xl border border-gray-200">
          {[
            { id: "timeline", icon: LayoutList, label: "Timeline" },
            { id: "table", icon: Table, label: "Table" },
            { id: "week", icon: CalendarDays, label: "Week" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === v.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <v.icon size={14} /> <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ScheduleLegend />

      {/* RENDER VIEWS (Menggunakan Component yang sama dengan handler handleSelectRow) */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center text-gray-400 font-bold text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          Memuat data operasional...
        </div>
      ) : (
        <>
          {viewMode === "table" && 
            <SessionTable 
              data={data} 
              dataSource={dataSource} 
              onSelectSession={handleSelectRow} 
              pagination={pagination} // 🟢 Teruskan state pagination
              onPageChange={(newPage, perPage) => setFilters(prev => ({ ...prev, page: newPage, ...(perPage ? { perPage } : {}) }))}
           />}
          {viewMode === "timeline" && 
            <SessionTimeline 
              data={data} 
              dataSource={dataSource} 
              onSelectSession={handleSelectRow} 
              pagination={pagination} 
              onPageChange={(newPage, perPage) => setFilters(prev => ({ ...prev, page: newPage, ...(perPage ? { perPage } : {}) }))} />}
          {viewMode === "week" && 
            <SessionWeek 
              data={data} 
              dataSource={dataSource} 
              onSelectSession={handleSelectRow} 
              pagination={pagination} 
              onPageChange={(newPage, perPage) => setFilters(prev => ({ ...prev, page: newPage, ...(perPage ? { perPage } : {}) }))} />}
        </>
      )}

      {/* 🟢 RENDER MODALS & DRAWERS */}
      <ScheduleWizardModal 
        open={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onSuccess={fetchData} 
      />

      {/* Drawer Mode SESSION */}
      <SessionPreview 
        open={!!selectedSession} 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
        onActionComplete={fetchData} 
      />

      {/* Drawer Mode MASTER */}
      <MasterPreview 
        open={!!selectedMaster} 
        master={selectedMaster} 
        onClose={() => setSelectedMaster(null)} 
        onEditPattern={() => setIsEditPatternOpen(true)}
        onToggleStatus={() => handleToggleStatus(selectedMaster.id, selectedMaster.is_active)}
      />

      {/* Modal Edit Pola (Hanya dipanggil dari Master) */}
      <EditPatternModal 
        open={isEditPatternOpen} 
        schedule={selectedMaster} 
        onClose={() => setIsEditPatternOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
    </div>
  );
}

// Legenda warna: warna kartu = jenis kelas (lokasi), pita kiri / badge = status sesi
function ScheduleLegend() {
  const types = [
    ["bg-blue-50 border-blue-300", "Reguler", "di gedung bimbel"],
    ["bg-emerald-50 border-emerald-300", "Private", "di rumah siswa"],
    ["bg-purple-50 border-purple-300", "Online", "dari mana saja"],
  ];
  const statuses = [
    ["bg-slate-300", "Terjadwal"], ["bg-blue-500", "Berlangsung"], ["bg-emerald-500", "Selesai"],
    ["bg-amber-500", "Dipindah"], ["bg-rose-500", "Dibatalkan"],
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-gray-100 bg-slate-50/70 px-4 py-3 text-xs text-gray-600">
      <span className="font-black text-gray-500 uppercase tracking-wider text-[10px]">Jenis kelas</span>
      {types.map(([cls, label, hint]) => (
        <span key={label} className="flex items-center gap-1.5"><span className={`w-4 h-3 rounded border ${cls}`} /> <b className="text-gray-800">{label}</b> <span className="text-gray-400">{hint}</span></span>
      ))}
      <span className="font-black text-gray-500 uppercase tracking-wider text-[10px] ml-2">Status</span>
      {statuses.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5"><span className={`w-1.5 h-3.5 rounded ${cls}`} /> {label}</span>
      ))}
    </div>
  );
}
