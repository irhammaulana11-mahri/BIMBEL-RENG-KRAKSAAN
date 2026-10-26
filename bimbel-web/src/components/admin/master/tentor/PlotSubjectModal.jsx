import React, { useState, useEffect, useMemo } from "react";
import { X, Search, BookOpen, Check, Save } from "lucide-react";
import MiniDataTable from "../../../ui/minitable/MiniDataTable";
import { getSubjects } from "../../../../services/admin/subjectService";
import { syncTentorSubjects } from "../../../../services/admin/tentorService";

export default function PlotSubjectModal({ open, tentor, onClose, onSuccess }) {
  const [subjects, setSubjects] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Filters
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Pagination MiniDataTable
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (open && tentor) {
      fetchSubjects();
      setSearch("");
      setSelectedLevel("");
      setCurrentPage(1);

      const existingIds = tentor.subjects
        ? tentor.subjects.map((s) => s.id || s.subject_id || s)
        : [];
      setSelectedSubjectIds(existingIds);
    }
  }, [open, tentor]);

  const fetchSubjects = async () => {
    try {
      setFetching(true);
      const res = await getSubjects({ perPage: 100 });
      const data = res.data?.data || res.data || [];
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat mata pelajaran:", err);
    } finally {
      setFetching(false);
    }
  };

  // Filter Mata Pelajaran berdasarkan Keyword & Jenjang
  const filteredSubjects = useMemo(() => {
    let result = subjects;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.code || "").toLowerCase().includes(q)
      );
    }

    if (selectedLevel) {
      result = result.filter(
        (s) =>
          String(s.education_level_id) === String(selectedLevel) ||
          (s.education_level_name || s.education_level?.display_name || "").toLowerCase().includes(selectedLevel.toLowerCase())
      );
    }

    return result;
  }, [subjects, search, selectedLevel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLevel]);

  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentSubjectData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  const handleToggleSelect = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Kolom MiniDataTable
  const columns = [
    {
      header: "Kode & Mapel",
      accessor: "name",
      cellClassName: "font-bold text-gray-900 text-xs",
      render: (row) => (
        <div>
          <p className="font-bold text-gray-900 text-xs">{row.name}</p>
          <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
            {row.code || "KODE-MAPEL"}
          </span>
        </div>
      ),
    },
    {
      header: "Jenjang",
      accessor: "education_level_name",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-100">
          {row.education_level_name || row.education_level?.display_name || row.education_level || "SD/SMP/SMA"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      cellClassName: "whitespace-nowrap text-center",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${row.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {row.is_active ? "Aktif" : "Non-Aktif"}
        </span>
      )
    },
    {
      header: "Pilih",
      headerAlign: "center",
      align: "center",
      cellClassName: "whitespace-nowrap w-20",
      render: (row) => {
        const isSelected = selectedSubjectIds.includes(row.id);
        return (
          <button
            type="button"
            onClick={() => handleToggleSelect(row.id)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
              isSelected
                ? "bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600"
                : "bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600"
            }`}
          >
            {isSelected ? <Check size={13} strokeWidth={3} /> : "Pilih"}
          </button>
        );
      },
    },
  ];

  if (!open || !tentor) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await syncTentorSubjects(tentor.id, selectedSubjectIds);
      if (onSuccess) {
        await onSuccess(tentor.id);
      }
      onClose();
    } catch (err) {
      console.error("Gagal sync mata pelajaran tentor:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 tracking-tight">Plotting Mata Pelajaran</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Atur pengampuan mata pelajaran untuk <span className="font-bold text-gray-700">{tentor.name || tentor.user?.name || "Tentor"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar (Search & Jenjang) */}
        <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama mapel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border border-gray-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Semua Jenjang</option>
            <option value="SD">SD / Sederajat</option>
            <option value="SMP">SMP / Sederajat</option>
            <option value="SMA">SMA / Sederajat</option>
          </select>
        </div>

        {/* Tabel Reusable MiniDataTable */}
        <div className="flex-1 overflow-y-auto">
          <MiniDataTable
            columns={columns}
            data={currentSubjectData}
            loading={fetching}
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
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-500">
            Terpilih: <span className="text-blue-600 font-mono font-black">{selectedSubjectIds.length}</span> Mapel
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save size={14} />
              {loading ? "Menyimpan..." : "Simpan Plotting"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}