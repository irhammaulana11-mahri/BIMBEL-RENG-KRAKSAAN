import React, { useEffect, useState } from "react";
import { ArrowLeft, Award, CheckCircle, Clock, Search } from "lucide-react";
import ExamResultDetailModal from "@/components/exam/ExamResultDetailModal";
import { getExamResults, getExamResultDetail, gradeExamResult, getApiErrorMessage } from "@/services/exam/examService";

export default function ExamResultList({ exam, onBack }) {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ total: 0, graded: 0, pending: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchResults = async () => {
    try {
      const res = await getExamResults(exam.id, { status, keyword });
      setResults(res.data.data || []);
      setSummary(res.data.summary || {});
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat hasil ujian."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [exam.id, status, keyword]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Ujian
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hasil Nilai Ujian: {exam.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{exam.subject_name} • Skala nilai {exam.total_score}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Mengumpulkan</p><p className="text-2xl font-black text-gray-900">{summary.total}</p></div>
          <div className="p-4 rounded-2xl border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Sudah Dinilai</p><p className="text-2xl font-black text-green-700">{summary.graded}</p></div>
          <div className="p-4 rounded-2xl border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Menunggu Essay</p><p className="text-2xl font-black text-amber-600">{summary.pending}</p></div>
          <div className="p-4 rounded-2xl border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Rata-rata</p><p className="text-2xl font-black text-blue-700">{summary.average}</p></div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Cari nama siswa..." className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm bg-white">
            <option value="">Semua Status</option>
            <option value="SUBMITTED">Menunggu Nilai Essay</option>
            <option value="GRADED">Sudah Dinilai</option>
          </select>
        </div>

        {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
                <th className="p-5">Nama Lengkap Siswa</th>
                <th className="p-5">Pelaksanaan</th>
                <th className="p-5 text-center">Benar / Salah / Kosong</th>
                <th className="p-5 text-center">Nilai Akhir</th>
                <th className="p-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">Memuat hasil...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">Belum ada siswa yang mengumpulkan ujian ini.</td></tr>
              ) : results.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="p-5">
                    <p className="font-bold text-gray-900">{r.student_name}</p>
                    <p className="text-xs text-gray-400">NIS {r.student_nis}</p>
                  </td>
                  <td className="p-5 text-xs text-gray-600">
                    <p className="font-semibold">{r.mode === "SESSION" ? `Sesi KBM ${r.class_name || ""}` : "Terjadwal"}</p>
                    <p className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {r.submitted_at} WIB</p>
                  </td>
                  <td className="p-5 text-center font-semibold">{r.total_correct} / {r.total_wrong} / {r.total_unanswered}</td>
                  <td className="p-5 text-center">
                    {r.status === "GRADED" ? (
                      <span className="inline-flex items-center gap-1 font-black text-gray-900"><Award className="w-4 h-4 text-blue-600" /> {r.score}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">Menunggu essay</span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <button onClick={() => setSelectedId(r.id)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${r.status === "SUBMITTED" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                      <CheckCircle className="w-3.5 h-3.5" /> {r.status === "SUBMITTED" ? "Nilai Essay" : "Lihat Jawaban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExamResultDetailModal
        open={!!selectedId}
        resultId={selectedId}
        onClose={() => setSelectedId(null)}
        fetchDetail={getExamResultDetail}
        gradeResult={gradeExamResult}
        onSaved={fetchResults}
      />
    </div>
  );
}
