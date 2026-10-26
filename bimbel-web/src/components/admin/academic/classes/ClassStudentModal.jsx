import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Search, Users, Save } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getStudentsForClass } from "@/services/academic/classService";

export default function ClassStudentModal({ open, onClose, classData, onSubmit }) {
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Hydrate data siswa terpilih & fetch siswa berdasarkan education_level kelas
  useEffect(() => {
    if (open && classData) {
      const initialIds = (classData.students || []).map((st) => String(st.id || st.student_id));
      setSelectedStudentIds(initialIds);
      setSearch("");
      setCurrentPage(1);
      
      setLoading(true);
      // 🟢 Memakai Service API dan menambahkan fallback string education_level
      getStudentsForClass({
        education_level: classData.education_level,
        education_level_id: classData.education_level_id,
      })
        .then((res) => {
          // 🟢 Safely extract array data mencegah undefined
          const data = res?.data?.data || res?.data || res || [];
          setStudentList(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, classData]);

  // Toggle Pilihan Siswa
  const handleToggleStudent = (studentId) => {
    const idStr = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  // Submit / Simpan Perubahan Siswa
  const handleSave = async () => {
    if (!classData?.id) return;
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ class_id: classData.id, student_ids: selectedStudentIds });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Search
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentList;
    const q = search.toLowerCase().trim();
    return studentList.filter((st) => {
      const name = String(st.full_name || st.name || "").toLowerCase();
      const nis = String(st.nis || "").toLowerCase();
      const school = String(st.school_name || "").toLowerCase();
      const parent = String(st.parent_name || st.parents?.[0]?.full_name || "").toLowerCase();
      return name.includes(q) || nis.includes(q) || school.includes(q) || parent.includes(q);
    });
  }, [studentList, search]);

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  if (!open || !classData) return null;

  const columns = [
    {
      header: "Siswa - Sekolah",
      cellClassName: "min-w-[160px]",
      render: (row) => (
        <div>
          <p className="font-bold text-sm text-gray-950">{row.full_name || row.name}</p>
          <p className="text-[12px] font-mono font-bold text-gray-600">{ row.school_name || "-"}</p>
        </div>
      ),
    },
    {
      header: "Jenjang - Kelas",
      cellClassName: "w-40",
      render: (row) => (
        <span className="px-2 py-0.5 bg-purple-50 text-bold-700 font-bold text-[12px] rounded border border-purple-100">
          {row.education_level || classData.education_level} - {row.grade || row.display_grade || "-"}
        </span>
      ),
    },
    {
      header: "Orang Tua & Sekolah",
      cellClassName: "min-w-[180px]",
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-gray-800">{row.parent_name || row.parents?.[0]?.full_name || "-"}</p>
          <p className="font-bold text-[12px] text-gray-700 truncate max-w-[200px]">{row.address  || "-"}</p>
        </div>
      ),
    },
    {
      header: "Pilih",
      headerAlign: "center",
      align: "center",
      cellClassName: "w-20",
      render: (row) => {
        const isSelected = selectedStudentIds.includes(String(row.id));
        return (
          <button
            type="button"
            onClick={() => handleToggleStudent(row.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              isSelected
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600"
            }`}
          >
            {isSelected ? <Check size={14} className="inline mx-auto" /> : "Pilih"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-950 tracking-tight">Kelola Siswa Class</h2>
              <p className="text-xs text-gray-400">
                Pilih siswa untuk dimasukkan ke <strong className="text-gray-800">{classData.name}</strong> ({selectedStudentIds.length}/{classData.max_students || 10} Kuota)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, ortu, NISN, atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <MiniDataTable
            columns={columns}
            data={currentData}
            loading={loading}
            emptyMessage={`Tidak ada siswa terdaftar untuk jenjang ${classData.education_level || "SD"}.`}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage,
              onPageChange: (p) => setCurrentPage(p),
            }}
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs font-semibold text-gray-500">
            Terpilih: <strong className="text-blue-600 font-mono">{selectedStudentIds.length}</strong> Siswa
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Batal
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? "Menyimpan..." : "Simpan Siswa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}