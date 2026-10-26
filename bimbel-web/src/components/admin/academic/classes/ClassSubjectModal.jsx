import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Search, BookOpen, Save } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getSubjectsForClass } from "@/services/academic/classService";

export default function ClassSubjectModal({ open, onClose, classData, onSuccess, onSubmit }) {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🟢 Fetch Data via Service
  useEffect(() => {
    if (open && classData) {
      // 1. Ambil data mapel yang SUDAH TERIKAT pada kelas ini
      const savedClassSubjects = classData.class_subjects || classData.subjects || [];
      
      const initialSelected = savedClassSubjects.map((cs) => ({
        subject_id: String(cs.subject_id || cs.subject?.id || cs.id),
        package_subject_id: cs.package_subject_id || classData.package_id || null,
        tentor_id: cs.tentor_id || "",
        meeting_target: cs.meeting_target || classData.meeting_per_month || 16,
      })).filter((s) => Boolean(s.subject_id));

      setSelectedSubjects(initialSelected);
      setSearch("");
      setCurrentPage(1);

      // 2. Fetch SEMUA master subject sesuai jenjang menggunakan SERVICE
      setLoading(true);
      getSubjectsForClass({
        education_level: classData.education_level,
        education_level_id: classData.education_level_id,
      })
        .then((res) => {
          const apiData = res.data || res || [];
          setMasterSubjects(Array.isArray(apiData) ? apiData : []);
        })
        .catch((err) => {
          console.error("Gagal memuat master subject:", err);
          // Fallback ke mapel yang tersimpan jika network error
          const fallbackList = savedClassSubjects.map((cs) => ({
            id: String(cs.subject_id || cs.subject?.id || cs.id),
            code: cs.subject_code || cs.subject?.code || "MAPEL",
            name: cs.subject_name || cs.subject?.name || "Mata Pelajaran",
            education_level: classData.education_level || "SD",
          }));
          setMasterSubjects(fallbackList);
        })
        .finally(() => setLoading(false));
    }
  }, [open, classData]);

  // Toggle Pilihan Subject (Centang Bulat Hijau <-> Pilih)
  const handleToggleSubject = (sub) => {
    const subIdStr = String(sub.id);
    const exists = selectedSubjects.some((s) => String(s.subject_id) === subIdStr);

    if (exists) {
      setSelectedSubjects((prev) => prev.filter((s) => String(s.subject_id) !== subIdStr));
    } else {
      setSelectedSubjects((prev) => [
        ...prev,
        {
          subject_id: subIdStr,
          package_subject_id: classData.package_id || null,
          tentor_id: "",
          meeting_target: classData.meeting_per_month || 16,
        },
      ]);
    }
  };

  const handleSave = async () => {
    if (!classData?.id) return;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ class_id: classData.id, subjects: selectedSubjects });
      } else if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Gagal memperbarui mata pelajaran kelas:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Search
  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return masterSubjects;
    const q = search.toLowerCase().trim();
    return masterSubjects.filter(
      (s) => (s.name || "").toLowerCase().includes(q) || (s.code || "").toLowerCase().includes(q)
    );
  }, [masterSubjects, search]);

  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  if (!open || !classData) return null;

  const columns = [
    {
      header: "MATA PELAJARAN",
      cellClassName: "py-3 min-w-[180px]",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-xs text-gray-950">{row.name}</p>
          <p className="text-[10px] font-mono font-semibold text-blue-500">{row.code || "-"}</p>
        </div>
      ),
    },
    {
      header: "JENJANG",
      cellClassName: "py-3 w-28",
      render: (row) => (
        <span className="inline-block px-2.5 py-0.5 bg-slate-100/80 text-slate-600 font-black text-[10px] rounded-md border border-slate-200/60 shadow-2xs">
          {row.education_level || classData.education_level || "SD"}
        </span>
      ),
    },
    {
      header: "PILIH",
      headerAlign: "center",
      align: "center",
      cellClassName: "py-3 w-24",
      render: (row) => {
        // 🟢 Cek apakah ID mapel ada di dalam array selectedSubjects
        const isSelected = selectedSubjects.some(
          (s) => String(s.subject_id) === String(row.id)
        );

        return (
          <button
            type="button"
            onClick={() => handleToggleSubject(row)}
            className={`transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isSelected
                ? "w-10 h-7 rounded-full bg-emerald-500 text-white shadow-xs hover:bg-emerald-600"
                : "px-4 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600"
            }`}
          >
            {isSelected ? <Check size={16} strokeWidth={2.8} /> : "Pilih"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-950 tracking-tight">Kelola Subject Class</h2>
              <p className="text-xs text-gray-400">
                Pilih mata pelajaran terikat untuk <strong className="text-gray-800">{classData.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Field & Table */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari mata pelajaran atau kode mapel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <MiniDataTable
            columns={columns}
            data={currentData}
            loading={loading}
            emptyMessage={`Tidak ada mata pelajaran untuk jenjang ${classData.education_level || "SD"}.`}
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
          <span className="text-xs font-bold text-emerald-600">
            Terpilih: <span className="font-mono">{selectedSubjects.length}</span> Subject
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? "Menyimpan..." : "Simpan Subject"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}