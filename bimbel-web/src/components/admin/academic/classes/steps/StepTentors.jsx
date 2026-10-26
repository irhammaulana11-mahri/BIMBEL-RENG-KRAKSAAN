import React, { useState, useEffect, useMemo } from "react";
import { Check, Search, User } from "lucide-react";
import MiniDataTable from "@/components/ui/minitable/MiniDataTable";
import { getTentorsForClass } from "@/services/academic/classService";

export default function StepTentors({ formData, setFormData }) {
  const [availableTentors, setAvailableTentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination MiniDataTable
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🟢 1. Ambil data tentor berdasarkan education_level & subject_ids dari Step 2
  useEffect(() => {
    const selectedSubjectIds = (formData.subjects || [])
      .map((s) => s.subject_id)
      .filter(Boolean);

    if (selectedSubjectIds.length > 0) {
      setLoading(true);
      getTentorsForClass({
        education_level: formData.education_level,
        education_level_id: formData.education_level_id,
        subject_ids: selectedSubjectIds,
      })
        .then((res) => {
          const data = res.data?.data || res.data || [];
          setAvailableTentors(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Gagal memuat tentor:", err);
        })
        .finally(() => setLoading(false));
    } else {
      setAvailableTentors([]);
    }
  }, [formData.education_level, formData.education_level_id, formData.subjects]);

  // Reset pagination jika search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 🟢 2. Filter Tentor berdasarkan kata kunci pencarian (Nama / Kode / Spesialisasi)
  const filteredTentors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableTentors;

    return availableTentors.filter((t) => {
      const name = (t.name || t.user?.name || "").toLowerCase();
      const code = (t.code || t.nip || "").toLowerCase();
      const spec = (t.specialization || "").toLowerCase();
      return name.includes(q) || code.includes(q) || spec.includes(q);
    });
  }, [availableTentors, search]);

  // Slicing data pagination
  const totalItems = filteredTentors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentTentorsData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTentors.slice(start, start + itemsPerPage);
  }, [filteredTentors, currentPage, itemsPerPage]);

  // 🟢 3. Toggle Pilih Tentor (Menautkan tentor ke subject yang relevan di formData)
  const handleToggleTentor = (tentor) => {
    const tentorIdStr = String(tentor.id);
    const tentorName = tentor.name || tentor.user?.name || tentor.full_name || "Tentor";

    const isSelected = (formData.subjects || []).some((s) => String(s.tentor_id) === tentorIdStr);

    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) =>
          String(s.tentor_id) === tentorIdStr ? { ...s, tentor_id: "", tentor_name: "" } : s
        ),
      }));
    } else {
      setFormData((prev) => {
        let assigned = false;
        const updatedSubjects = prev.subjects.map((s) => {
          if (!s.tentor_id && !assigned) {
            assigned = true;
            return { ...s, tentor_id: tentor.id, tentor_name: tentorName }; // 🟢 Simpan nama tentor
          }
          return s;
        });

        if (!assigned && updatedSubjects.length > 0) {
          updatedSubjects[0] = { ...updatedSubjects[0], tentor_id: tentor.id, tentor_name: tentorName };
        }

        return { ...prev, subjects: updatedSubjects };
      });
    }
  };

  // 🟢 4. Konfigurasi Kolom MiniDataTable
  const columns = [
    // 1. Nama Tentor
    {
      header: "NAMA TENTOR",
      cellClassName: "min-w-[160px]",
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-gray-950">
            {row.name || row.user?.name || "Tentor"}
          </p>
          <p className="text-[10px] font-mono font-bold text-blue-600 mt-0.5">
            {row.code || row.nip || "TTR-"}
          </p>
        </div>
      ),
    },

    // 2. Mapel - Grade
    {
      header: "MAPEL - GRADE",
      cellClassName: "min-w-[180px]",
      render: (row) => {
        // Ambil info spesialisasi mapel dan jenjang dari data tentor
        const specText = row.specialization || row.subject_names?.join(", ") || "Semua Mapel";
        const gradeText = row.education_level || formData.education_level || "SD";

        return (
          <div className="flex flex-wrap items-center gap-1">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded border border-blue-100">
              {specText}
            </span>
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-mono font-bold text-[10px] rounded border border-purple-100">
              {gradeText}
            </span>
          </div>
        );
      },
    },

    // 3. Pilih (Button Aksi)
    {
      header: "PILIH",
      headerAlign: "center",
      align: "center",
      cellClassName: "whitespace-nowrap w-24",
      render: (row) => {
        // Cek apakah tentor terpilih di formData.subjects
        const isSelected = (formData.subjects || []).some(
          (s) => String(s.tentor_id) === String(row.id)
        );

        return (
          <button
            type="button"
            onClick={() => handleToggleTentor(row)}
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

  // Hitung berapa tentor yang sudah dipilih secara unik
  const selectedTentorsCount = new Set(
    (formData.subjects || []).map((s) => s.tentor_id).filter(Boolean)
  ).size;

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      
      {/* Header Info Terplot */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Pilih Tentor Pengampu (MiniDataTable)
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Berdasarkan Jenjang <strong className="text-gray-700">{formData.education_level || "SD"}</strong> & Mapel terpilih.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
          Terpilih: {selectedTentorsCount} Tentor
        </span>
      </div>

      {/* Input Pencarian Tentor */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama tentor, NIP, atau spesialisasi mapel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Tabel Utama Reusable MiniDataTable */}
      <MiniDataTable
        columns={columns}
        data={currentTentorsData}
        loading={loading}
        emptyMessage={
          (formData.subjects || []).length === 0
            ? "Belum ada mata pelajaran yang dipilih pada Step 2."
            : `Tidak ada tentor yang tersedia untuk jenjang ${formData.education_level || "SD"} dan mapel terpilih.`
        }
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