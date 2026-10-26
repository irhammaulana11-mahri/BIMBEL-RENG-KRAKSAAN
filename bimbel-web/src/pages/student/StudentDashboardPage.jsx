import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Award, Hourglass, PlayCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { getStudentExams } from "@/services/exam/examService";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({ available: [], upcoming: [], history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentExams()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const graded = data.history.filter(r => r.status === "GRADED");
  const average = graded.length ? Math.round(graded.reduce((sum, r) => sum + Number(r.score), 0) / graded.length * 10) / 10 : "-";
  const waiting = data.history.filter(r => r.status === "SUBMITTED").length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Halo, {user?.name || "Siswa"} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan ujian dan hasil belajar Anda.</p>
      </div>

      {data.available.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase opacity-80">Ujian sedang dibuka</p>
            <p className="text-lg font-black">{data.available[0].title}{data.available.length > 1 ? ` (+${data.available.length - 1} lainnya)` : ""}</p>
          </div>
          <button onClick={() => navigate("/student/exams")} className="px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-black flex items-center gap-2">
            <PlayCircle size={16}/> Kerjakan Sekarang
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><ClipboardCheck size={13}/> Ujian Dikerjakan</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{loading ? "…" : data.history.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><Award size={13}/> Rata-rata Nilai</p>
          <p className="text-3xl font-black text-indigo-900 mt-1">{loading ? "…" : average}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1"><Hourglass size={13}/> Menunggu Penilaian</p>
          <p className="text-3xl font-black text-amber-900 mt-1">{loading ? "…" : waiting}</p>
        </div>
      </div>

      {graded.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">Hasil Terbaru</h2>
            <button onClick={() => navigate("/student/exams")} className="text-xs font-bold text-indigo-600">Lihat semua</button>
          </div>
          <div className="divide-y divide-gray-100">
            {graded.slice(0, 5).map(r => (
              <button key={r.id} onClick={() => navigate(`/student/exams/${r.id}`)} className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">{r.exam_title}</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase">{r.subject_name}</p>
                </div>
                <span className="text-lg font-black text-indigo-700">{r.score}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
