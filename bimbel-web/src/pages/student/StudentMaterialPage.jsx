import React, { useEffect, useState } from "react";
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import MaterialItem from "@/components/student/MaterialItem";
import { getStudentMaterials } from "@/services/student/learningService";
import { getApiErrorMessage } from "@/utils/apiError";

export default function StudentMaterialPage() {
  const [data, setData] = useState({ subjects: [], total: 0, subject_options: [] });
  const [filters, setFilters] = useState({ keyword: "", subject_id: "" });
  const [openSubject, setOpenSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getStudentMaterials(filters)
        .then((res) => {
          setData({ subjects: [], total: 0, subject_options: [], ...res.data.data });
          setError("");
        })
        .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat materi.")))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Saat mencari, semua mapel dibuka agar hasil terlihat
  const isOpen = (id) => filters.keyword || data.subjects.length === 1 || openSubject === id;

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Materi Belajar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Materi dari mapel di kelas Anda, tersusun per bab. Tanda hijau berarti materi sudah dibahas di kelas.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Cari judul materi atau bab..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-white" />
        </div>
        {data.subject_options.length > 1 && (
          <select value={filters.subject_id} onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
            <option value="">Semua mapel</option>
            {data.subject_options.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <p className="p-10 text-center text-sm text-gray-400">Memuat materi...</p>
      ) : data.subjects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">
          {filters.keyword || filters.subject_id ? "Tidak ada materi yang cocok." : "Belum ada materi untuk kelas Anda."}
        </div>
      ) : (
        <div className="space-y-4">
          {data.subjects.map((subject) => (
            <div key={subject.subject_id} className="bg-white border border-gray-200 rounded-2xl">
              <button onClick={() => setOpenSubject(openSubject === subject.subject_id ? null : subject.subject_id)} className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 rounded-2xl">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={18} /></div>
                <div className="flex-1">
                  <p className="font-black text-gray-900">{subject.subject_name}</p>
                  <p className="text-xs text-gray-400">{subject.chapters.length} bab • {subject.material_count} materi • {subject.covered_count} sudah dibahas</p>
                </div>
                <div className="hidden sm:block w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${subject.material_count ? Math.round(subject.covered_count / subject.material_count * 100) : 0}%` }} />
                </div>
                {isOpen(subject.subject_id) ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {isOpen(subject.subject_id) && (
                <div className="px-4 pb-4 space-y-4">
                  {subject.chapters.map((chapter, index) => (
                    <div key={chapter.id}>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Bab {index + 1} • {chapter.title}{chapter.semester && <span className="normal-case font-semibold text-gray-400"> (semester {chapter.semester})</span>}</p>
                      <div className="space-y-2">
                        {chapter.materials.map((m) => <MaterialItem key={m.id} material={m} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
