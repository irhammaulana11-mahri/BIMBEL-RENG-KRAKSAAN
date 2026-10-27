import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getApiErrorMessage } from "@/utils/apiError";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Pencil, Trash2, GraduationCap, UserCheck, UserX, Users, Plus,RotateCcw,RefreshCw, } from "lucide-react";
import StudentModal from "../../../components/admin/master/student/StudentModal";
import StudentPreview from "../../../components/admin/master/student/StudentPreview";
import StudentTable from "../../../components/admin/master/student/StudentTable";
import PremiumStatCard from "../../../components/ui/StatCard"
import {deleteStudent, getStudents, updateStudent,} from "../../../services/admin/studentService";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import ConfirmationModal from "../../../components/ui/confirmation/ConfirmationModal";
import { formatDate } from "../../../components/utils/dateFormatter";
import useDebounce from "@/hooks/useDebounce";
import { DEFAULT_LEAD_FILTER } from "../../../components/constants/student.constants";
import { useConfirm } from "@/components/ui/confirmation";


export default function StudentPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filters, setFilters] = useState(DEFAULT_LEAD_FILTER);
  const [classFilter, setClassFilter] = useState(""); 
  const [currentPage, setCurrentPage] = useState(1);
  const keyword = useDebounce(filters.keyword, 500);
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const navigate = useNavigate();

  // State Pagination Dinamis
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    from: 0,
    to: 0,
    total: 0,
    lastPage: 1,
  });

  const statistics = {
    totalStudents : students.length,
    activeStudents : students.filter((s) => s.is_active === true).length,
    inactiveStudents : students.filter((s) => s.is_active === false).length,
  };
    

  // Handler Aksi Tambah Murid Baru
  const handleAddStudent = () => {
    navigate("/admin/students/new");
  };


  const updateFilter = useCallback((field, value) => {
      setFilters((prev) => ({
          ...prev,
          [field]: value,
      }));
    }, []);



  const query = useMemo(() => ({
      keyword,
      status: filters.status,
      education_level: filters.education_level,
      page: pagination.page,
      perPage: pagination.perPage,
    }), [keyword,filters.status,filters.education_level,pagination.page,pagination.perPage,]);
  

  // 1. Memuat Data dari API
  const loadData = useCallback(async (params = query) => {
    try {
      setLoading(true);
      const response = await getStudents(params);

      const {data,meta} = response.data;
      setStudents(data);
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
      showError("Gagal Memuat Data Murid.");
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
  }, [keyword,filters.status,filters.education_level]); 

  const handleRefresh = () => {
    loadData();
  };
  

  const handleEdit = (item) => {
    setSelectedStudent(item);
    setModalOpen(true);
  };

  const handleView = (student) => {
    setPreviewStudent(student);
  };

  
  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      if (selectedStudent) await updateStudent(selectedStudent.id, form);
        await loadData();
        setModalOpen(false);
        showSuccess("Berhasil Memperbarui Data Murid");
    } catch (err) {
      showError("Gagal Memperbarui Data Murid");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      const ok = await confirm.delete({
        title: "Hapus Data Murid",
        message: "Data Murid akan dihapus permanen."
      });
  
      if (!ok) return;
  
      try {
        confirm.setLoading(true);
        const response = await deleteStudent(id);
        showSuccess("Data Murid berhasil dihapus.");
        await loadData();
      } catch (err) {
        showError(getApiErrorMessage(err, "Gagal menghapus data murid."));
      } finally {
        confirm.setLoading(false);
      }
    };  

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">

      <Toast {...toast} onClose={hideToast} />

      {/* Header Standar (text-3xl) + Tombol Tambah yang Sejajar Flex */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Student Management</h1>
          <p className="text-base text-gray-500 mt-1">
            Pengaturan kelas, jadwal belajar dan paket dilakukan melalui modul Akademik.
          </p>
        </div>
        <button
          onClick={handleAddStudent}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Daftarkan Murid Baru
        </button>
      </div>

      {/* Row Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Murid" value={statistics.totalStudents} desc="Terdaftar di Database" icon={Users} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Murid Aktif" value={statistics.activeStudents} desc="Mengikuti Kegiatan Belajar" icon={UserCheck} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Murid Nonaktif" value={statistics.inactiveStudents} desc="Cuti / Paket Habis" icon={UserX} colorClass="bg-red-50 text-red-700" />
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
              placeholder="Cari nama murid / wali - orang tua..."
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
            <select
              value={filters.education_level || ""}
              onChange={(e) => updateFilter("education_level", e.target.value)}
              className="border border-gray-200/80 rounded-xl px-3.5 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 transition-all shadow-2xs cursor-pointer"
            >
              <option value="">Semua Jenjang</option>
              <option value="TK">TK</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
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

        {/* Render Tabel Standar Baru */}
        {/* Tabel */}
        <StudentTable 
          students={students}
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
          onDelete={handleDelete}/>
  

      <StudentModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          data={selectedStudent} 
          onSubmit={handleSubmit} 
          loading={loading} />

      <StudentPreview 
          student={previewStudent} 
          onClose={() => setPreviewStudent(null)} />
    </div>
  </div>
  );
}