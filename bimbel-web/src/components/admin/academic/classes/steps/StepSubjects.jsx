import React, { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getSubjectsForClass } from "@/services/academic/classService";

export default function StepSubjects({ formData, setFormData }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🟢 Fetch Data on Mount/Change
  useEffect(() => {
    if (formData.education_level_id) {
      setLoading(true);
      getSubjectsForClass({ education_level_id: formData.education_level_id })
        .then((res) => {
          setSubjects(res.data || []);
        })
        .catch((err) => console.error("Gagal load mapel:", err))
        .finally(() => setLoading(false));
    }
  }, [formData.education_level_id]);

  const totalItems = subjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return subjects.slice(start, start + itemsPerPage);
  }, [subjects, currentPage, itemsPerPage]);

  const handleToggleSubject = (sub) => {
    const targetId = String(sub.id);
    const exists = formData.subjects.some((s) => String(s.subject_id) === targetId);

    if (exists) {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => String(s.subject_id) !== targetId),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subjects: [
          ...prev.subjects,
          {
            subject_id: sub.id,
            subject_name: sub.name,
            tentor_id: "",
            tentor_name: "",
            meeting_target: formData.meeting_per_month || 16,
          },
        ],
      }));
    }
  };

  const columns = [
    {
      header: "Mata Pelajaran",
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-gray-900">{row.name}</p>
          <p className="text-[10px] font-mono text-blue-600">{row.code || "-"}</p>
        </div>
      ),
    },
    {
      header: "Pilih",
      align: "center",
      render: (row) => {
        const isSelected = formData.subjects.some((s) => String(s.subject_id) === String(row.id));
        return (
          <button
            type="button"
            onClick={() => handleToggleSubject(row)}
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
    <div className="space-y-3 animate-in fade-in duration-200">
      <MiniDataTable
        columns={columns}
        data={currentData}
        loading={loading}
        emptyMessage={`Tidak ada mata pelajaran untuk jenjang yang dipilih.`}
        pagination={{
          currentPage, totalPages, totalItems, itemsPerPage,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}