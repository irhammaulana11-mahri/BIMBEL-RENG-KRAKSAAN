import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, PenLine, CheckCircle2, Award, Clock, FileDown, Users } from "lucide-react";
import PremiumStatCard from "../../components/ui/StatCard";
import { downloadFile } from "@/utils/download";
import ExamResultDetailModal from "@/components/exam/ExamResultDetailModal";
import {
  getTentorExamResults, getTentorExamResultDetail, gradeTentorExamResult, getApiErrorMessage,
} from "@/services/exam/examService";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";

export default function TentorEvaluationPage() {
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get("activity") || "";

  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, graded: 0, average: null, students: 0 });
  const [exporting, setExporting] = useState(false);

  // Rekap PDF mengikuti filter yang sedang aktif
  const exportPdf = async () => {
    setExporting(true);
    try {
      await downloadFile("/tentor/exam-results/export", "Rekap-Evaluasi.pdf", { status, keyword, session_activity_id: activityId });
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengekspor PDF."));
    } finally {
      setExporting(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(activityId ? "" : "SUBMITTED");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const fetchResults = async () => {
    try {
      const res = await getTentorExamResults({ status, keyword, session_activity_id: activityId });
      setResults(res.data.data || []);
      setSummary(res.data.summary || { pending: 0, graded: 0, average: null, students: 0 });
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
  }, [status, keyword, activityId]);

  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(results || []);

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Evaluasi Murid</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hasil ujian online siswa pada sesi Anda. Nilai essay agar hasil tampil ke siswa.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumStatCard title="Perlu Dinilai" value={summary.pending} desc="Jawaban essay menunggu" icon={PenLine} colorClass="text-amber-700" />
        <PremiumStatCard title="Sudah Dinilai" value={summary.graded} desc="Nilai tampil ke siswa" icon={CheckCircle2} colorClass="text-green-700" />
        <PremiumStatCard title="Rata-rata Nilai" value={summary.average ?? "-"} desc={summary.highest != null ? `Tertinggi ${summary.highest}` : "Dari hasil yang dinilai"} icon={Award} colorClass="text-indigo-700" />
        <PremiumStatCard title="Siswa" value={summary.students ?? 0} desc="Mengerjakan ujian pada filter ini" icon={Users} colorClass="text-blue-700" />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200">
        <div className="flex bg-gray-100 p-0.5 rounded-xl">
          {[["SUBMITTED", "Perlu Dinilai"], ["GRADED", "Sudah Dinilai"], ["", "Semua"]].map(([value, label]) => (
            <button key={label} onClick={() => setStatus(value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === value ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}>{label}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Cari siswa atau judul ujian..." className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500" />
        </div>
        {activityId && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Filter: satu aktivitas sesi</span>}
        <button onClick={exportPdf} disabled={exporting || results.length === 0} className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
          <FileDown size={14} /> {exporting ? "Mengekspor..." : "Export PDF"}
        </button>
      </div>

      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat hasil ujian...</div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm font-bold text-gray-400">
          {status === "SUBMITTED" ? "Tidak ada jawaban yang perlu dinilai." : "Belum ada hasil ujian."}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
          <table className="ui-table w-full text-left min-w-[720px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <th className="p-4">Siswa</th>
                <th className="p-4">Ujian</th>
                <th className="p-4">Dikumpulkan</th>
                <th className="p-4 text-center">Nilai</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{r.student_name}</p>
                    <p className="text-[10px] font-semibold text-gray-500">NIS {r.student_nis}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-800">{r.exam_title}</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase">{r.subject_name} {r.class_name ? `• ${r.class_name}` : ""}</p>
                  </td>
                  <td className="p-4 text-xs font-semibold text-gray-600"><span className="flex items-center gap-1"><Clock size={12}/> {r.submitted_at} WIB</span></td>
                  <td className="p-4 text-center">
                    {r.status === "GRADED"
                      ? <span className="inline-flex items-center gap-1 text-sm font-black text-gray-900"><Award size={14} className="text-indigo-500"/> {r.score}</span>
                      : <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-black">MENUNGGU ESSAY</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedId(r.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${r.status === "SUBMITTED" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white border border-gray-200 text-indigo-700 hover:bg-indigo-50"}`}>
                      {r.status === "SUBMITTED" ? "Nilai Sekarang" : "Lihat Jawaban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination pagination={pagination} onPageChange={onPageChange} label="data" />
    </div>
      )}

      <ExamResultDetailModal
        open={!!selectedId}
        resultId={selectedId}
        onClose={() => setSelectedId(null)}
        fetchDetail={getTentorExamResultDetail}
        gradeResult={gradeTentorExamResult}
        onSaved={fetchResults}
      />
    </div>
  );
}
