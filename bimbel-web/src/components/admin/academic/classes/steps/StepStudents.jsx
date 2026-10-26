import React, { useState, useEffect, useMemo } from "react";
import { Check, Search, Users } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getStudentsForClass } from "@/services/academic/classService";

export default function StepStudents({ formData, setFormData }) {
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🟢 1. Fetch data siswa secara terfilter dari Service
  useEffect(() => {
    if (formData.education_level_id) {
      setLoading(true);
      getStudentsForClass({
        education_level_id: formData.education_level_id,
      })
        .then((res) => {
          setStudentList(res.data || []);
        })
        .catch((err) => console.error("Gagal memuat siswa:", err))
        .finally(() => setLoading(false));
    } else {
      setStudentList([]);
    }
  }, [formData.education_level_id]);

  // Reset pagination saat kata kunci pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 🟢 2. Client-side Search Filter (Fleksibel)
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return studentList;

    const q = search.toLowerCase().trim();
    return studentList.filter((st) => {
      const name = String(st.full_name || st.name || "").toLowerCase();
      const nis = String(st.nis || "").toLowerCase();
      const school = String(st.school_name || "").toLowerCase();

      return name.includes(q) || nis.includes(q) || school.includes(q);
    });
  }, [studentList, search]);

  // Slicing pagination
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // 🟢 3. Toggle Pilih Siswa
  const handleToggleStudent = (studentId) => {
    const targetId = String(studentId);
    setFormData((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(targetId)
        ? prev.student_ids.filter((id) => id !== targetId)
        : [...prev.student_ids, targetId],
    }));
  };

  // 🟢 4. Kolom MiniDataTable
  const columns = [
    {
      header: "Siswa",
      cellClassName: "min-w-[150px]",
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 truncate max-w-[180px]" title={row.full_name || row.name}>
            {row.full_name || row.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-blue-600">
              {row.nis || "STD-"}
            </span>
            {row.school_name && row.school_name !== "-" && (
              <span className="text-[10px] text-gray-400 truncate max-w-[120px]" title={row.school_name}>
                • {row.school_name}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Jenjang & Grade",
      cellClassName: "whitespace-nowrap min-w-[130px]",
      render: (row) => {
        const levelName = row.education_level || formData?.education_level || "SD";
        const gradeText = row.display_grade || row.grade;

        return (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded border border-purple-100">
              {levelName}
            </span>
            {gradeText && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200">
                {gradeText}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Pilih",
      headerAlign: "center",
      align: "center",
      cellClassName: "whitespace-nowrap w-20",
      render: (row) => {
        const isSelected = formData.student_ids.includes(String(row.id));
        return (
          <button
            type="button"
            onClick={() => handleToggleStudent(row.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              isSelected
                ? "bg-emerald-500 text-white shadow-2xs hover:bg-emerald-600"
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
    <div className="space-y-3.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} className="text-purple-600" /> Pilih Siswa Terikat (Opsional)
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Menampilkan siswa untuk jenjang <strong className="text-gray-700">{formData.education_level || "SD"}</strong>.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
          Quota: {formData.student_ids.length} / {formData.max_students || 10} Siswa
        </span>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama siswa, NIS, atau nama sekolah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      <MiniDataTable
        columns={columns}
        data={currentData}
        loading={loading}
        emptyMessage={`Tidak ada data siswa terdaftar untuk jenjang ${formData?.education_level || "SD"}.`}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage,
          onPageChange: (p) => setCurrentPage(p),
        }}
      />
    </div>
  );
}