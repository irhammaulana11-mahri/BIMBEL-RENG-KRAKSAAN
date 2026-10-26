import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Users, Save } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getTentorsForClass } from "@/services/academic/classService";

export default function ClassTentorModal({ open, onClose, classData, onSubmit }) {
  const [assignments, setAssignments] = useState([]);
  const [availableTentors, setAvailableTentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (open && classData) {
      const initialAssignments = (classData.class_subjects || []).map((cs) => ({
        subject_id: cs.subject_id,
        subject_name: cs.subject_name || cs.subject?.name,
        tentor_id: cs.tentor_id || "",
        meeting_target: cs.meeting_target || 16,
      }));
      setAssignments(initialAssignments);

      const subjectIds = initialAssignments.map((a) => a.subject_id).filter(Boolean);

      setLoading(true);
      // 🟢 Memakai Service API
      getTentorsForClass({
        education_level_id: classData.education_level_id,
        subject_ids: subjectIds,
      })
        .then((res) => setAvailableTentors(res.data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, classData]);

  const handleAssignTentor = (subjectId, tentorId) => {
    setAssignments((prev) =>
      prev.map((item) =>
        String(item.subject_id) === String(subjectId) ? { ...item, tentor_id: tentorId } : item
      )
    );
  };

  const handleSave = async () => {
    if (!classData?.id) return;
    setSubmitting(true);
    try {
        if (onSubmit) {
            // 🟢 Passing array assignments kembali ke ClassPage.jsx
            await onSubmit({
                class_id: classData.id,
                assignments: assignments,
            });
        }
        onClose();
    } catch (err) {
        console.error("Gagal menyimpan tentor:", err);
    } finally {
        setSubmitting(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    if (!search.trim()) return assignments;
    const q = search.toLowerCase().trim();
    return assignments.filter((a) => {
      const subName = (a.subject_name || "").toLowerCase();
      const tentor = availableTentors.find((t) => String(t.id) === String(a.tentor_id));
      const tentorName = (tentor?.name || "").toLowerCase();
      return subName.includes(q) || tentorName.includes(q);
    });
  }, [assignments, availableTentors, search]);

  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssignments.slice(start, start + itemsPerPage);
  }, [filteredAssignments, currentPage, itemsPerPage]);

  if (!open || !classData) return null;

  const columns = [
    {
      header: "Mata Pelajaran",
      cellClassName: "min-w-[160px]",
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-gray-950">{row.subject_name}</p>
          <span className="text-[10px] font-mono text-blue-600">Target: {row.meeting_target} Sesi</span>
        </div>
      ),
    },
    {
      header: "Tentor Pengampu Kualifikasi",
      cellClassName: "min-w-[220px]",
      render: (row) => {
        // 🟢 PERBAIKAN: Filter availableTentors KHUSUS untuk subject_id pada baris ini
        const qualifiedTentors = availableTentors.filter((t) => 
          t.subjects && t.subjects.some((s) => String(s.id) === String(row.subject_id))
        );

        return (
          <select
            value={row.tentor_id || ""}
            onChange={(e) => handleAssignTentor(row.subject_id, e.target.value)}
            className={`w-full border rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer focus:outline-none ${
              row.tentor_id ? "border-emerald-300 bg-emerald-50/50 text-emerald-900" : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <option value="">
              {qualifiedTentors.length > 0 ? "-- Belum Diplot (Pilih Tentor) --" : "-- Tidak Ada Tentor Sesuai Kualifikasi --"}
            </option>
            
            {/* 🟢 Render hanya tentor yang lolos filter kualifikasi mapel ini */}
            {qualifiedTentors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code || "TTR"})
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cellClassName: "w-28",
      render: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            row.tentor_id ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {row.tentor_id ? "Tersambung" : "Belum Diplot"}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-950 tracking-tight">Kelola Tentor Class</h2>
              <p className="text-xs text-gray-400">Plotting tentor pengampu untuk <strong className="text-gray-800">{classData.name}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari mata pelajaran atau nama tentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <MiniDataTable
            columns={columns}
            data={currentData}
            loading={loading}
            emptyMessage="Belum ada mata pelajaran terikat pada kelas ini."
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage,
              onPageChange: (p) => setCurrentPage(p),
            }}
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono font-bold text-blue-600">
            Terplot: {assignments.filter((a) => a.tentor_id).length} / {assignments.length} Subject
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Batal
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save size={14} /> {submitting ? "Menyimpan..." : "Simpan Tentor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}