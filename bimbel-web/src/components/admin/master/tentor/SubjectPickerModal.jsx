import React, { useState, useEffect, useMemo } from "react";
import { X, Search, BookOpen, Check, Plus } from "lucide-react";
import { getSubjects } from "../../../../services/admin/subjectService";
import MiniDataTable from "../../../ui/minitable/MiniDataTable";

// API mengirim education_level sebagai objek relasi; ambil nama jenjangnya saja
const levelName = (s) =>
  s.education_level_name || s.education_level?.display_name ||
  (typeof s.education_level === "string" ? s.education_level : "");

export default function SubjectPickerModal({ open, onClose, selectedSubjects = [], onSelect }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // State Pagination Mini Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (open) {
      fetchSubjects();
      setSearch("");
      setCurrentPage(1);
    }
  }, [open]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await getSubjects();
      const data = res.data?.data || res.data || [];
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat mata pelajaran:", err);
    } finally {
      setLoading(false);
    }
  };

  // Live Search Filter
  const filteredSubjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q) ||
        levelName(s).toLowerCase().includes(q)
    );
  }, [subjects, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination Slicing Data
  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentSubjectData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  // Konfigurasi Kolom Tabel Mini
  const columns = [
    {
      header: "Mata Pelajaran",
      accessor: "name",
      cellClassName: "font-bold text-gray-900 text-xs",
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900 text-xs">{row.name}</p>
          <span className="text-[10px] font-mono text-gray-400">{row.code || "-"}</span>
        </div>
      ),
    },
    {
      header: "Jenjang",
      accessor: "education_level",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-100">
          {levelName(row) || "SD/SMP/SMA"}
        </span>
      ),
    },
    {
      header: "Aksi",
      headerAlign: "center",
      align: "center",
      cellClassName: "whitespace-nowrap w-24",
      render: (row) => {
        const isSelected = selectedSubjects.some((s) => s.id === row.id);
        return (
          <button
            type="button"
            onClick={() => onSelect(row)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
              isSelected
                ? "bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
            }`}
          >
            {isSelected ? <Check size={13} strokeWidth={3} /> : <Plus size={13} />}
            <span>{isSelected ? "Terpilih" : "Pilih"}</span>
          </button>
        );
      },
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 tracking-tight">Pilih Mata Pelajaran</h3>
              <p className="text-xs text-gray-400 mt-0.5">Pilih mata pelajaran yang dikuasai dan berhak diampu oleh tentor.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Live Search Input */}
        <div className="py-4">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Mata Pelajaran berdasarkan Nama atau Kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Mini Table Container */}
        <div className="flex-1 overflow-y-auto">
          <MiniDataTable
            columns={columns}
            data={currentSubjectData}
            loading={loading}
            emptyMessage="Mata pelajaran tidak ditemukan."
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage,
              onPageChange: (page) => setCurrentPage(page),
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            Selesai Memilih ({selectedSubjects.length})
          </button>
        </div>

      </div>
    </div>
  );
}