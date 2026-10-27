import React, { useEffect, useState } from "react";
import { Calendar, Clock, Hourglass, MessageSquare } from "lucide-react";
import { PredicateBadge } from "@/components/report/ReportCardView";
import { getParentExamResults } from "@/services/parent/parentService";
import { formatScore } from "@/services/academic/progressReportService";
import { getApiErrorMessage } from "@/utils/apiError";

export default function ExamPage() {
  const [results, setResults] = useState([]);
  const [children, setChildren] = useState([]);
  const [childFilter, setChildFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getParentExamResults({ student_id: childFilter || undefined })
      .then((res) => {
        setResults(res.data.data || []);
        setChildren(res.data.children || []);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat hasil ujian.")))
      .finally(() => setLoading(false));
  }, [childFilter]);

  return (
    <div className="page-card space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Hasil Ujian</h1>
          <p className="text-base text-gray-500 mt-1">Ujian yang sudah dikerjakan anak. Nilai tampil setelah seluruh jawaban selesai dinilai.</p>
        </div>
        {children.length > 1 && (
          <select value={childFilter} onChange={(e) => setChildFilter(e.target.value)} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
            <option value="">Semua anak</option>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {loading && <div className="text-center py-12 text-gray-400 font-medium">Memuat hasil ujian...</div>}
      {!loading && results.length === 0 && (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 italic">Belum ada ujian yang dikerjakan.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs uppercase">{r.subject_name || "Mata Pelajaran"}</span>
                {r.status === "GRADED"
                  ? <PredicateBadge score={r.normalized_score} />
                  : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-amber-700 bg-amber-50"><Hourglass size={12} /> Menunggu penilaian</span>}
              </div>
              <div>
                <h3 className="text-base font-black text-gray-950 tracking-tight">{r.exam_title}</h3>
                <p className="text-sm font-semibold text-blue-600">{r.student_name}{r.class_name && <span className="text-gray-400 font-medium"> • {r.class_name}</span>}</p>
              </div>
              {r.status === "GRADED" ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50/70 border rounded-xl p-3 text-center">
                  <div><p className="text-[10px] font-bold uppercase text-gray-400">Nilai</p><p className="text-xl font-black text-gray-950">{formatScore(r.score)}<span className="text-xs text-gray-400">/{r.total_score}</span></p></div>
                  <div><p className="text-[10px] font-bold uppercase text-gray-400">Benar</p><p className="text-xl font-black text-emerald-700">{r.total_correct ?? "-"}</p></div>
                  <div><p className="text-[10px] font-bold uppercase text-gray-400">Salah/Kosong</p><p className="text-xl font-black text-rose-700">{(r.total_wrong ?? 0) + (r.total_unanswered ?? 0)}</p></div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 bg-slate-50 rounded-xl p-3">Jawaban essay sedang dinilai tentor. Nilai akan tampil setelah selesai.</p>
              )}
              {r.feedback && <p className="text-xs text-gray-600 italic flex gap-1.5"><MessageSquare size={14} className="shrink-0 text-purple-500" /> "{r.feedback}"</p>}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold">
              <span className="flex items-center gap-1"><Calendar size={14} /> {r.submitted_at}</span>
              {r.duration_minutes && <span className="flex items-center gap-1"><Clock size={14} /> {r.duration_minutes} menit</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
