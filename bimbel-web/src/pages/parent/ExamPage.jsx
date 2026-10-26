import React, { useEffect, useState } from "react";
import { ClipboardList, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import api from "../../api/axios";


export default function ExamPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const res = await api.get("/parent/exams-history"); // Endpoint data nilai ujian anak
        setExams(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Gagal memuat histori ujian:", err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Pelaksanaan Ujian & Try Out</h1>
        <p className="text-base text-gray-500 mt-1">Pantau rekam jejak, skor kelulusan, dan status pelaksanaan ujian evaluasi mandiri siswa.</p>
      </div>

      {loading && <div className="text-center py-12 text-gray-400 font-medium">Memuat rekapan ujian...</div>}

      {!loading && exams.length === 0 && (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 italic">
          Belum ada riwayat pelaksanaan Try Out atau ujian yang tercatat pada periode bimbingan ini.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 group">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs uppercase">
                  {exam.subject_name || "Mata Pelajaran"}
                </span>
                
                {/* Status Kelulusan Berdasarkan Passing Grade */}
                {exam.score >= exam.passing_grade ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 size={12} /> Lulus Evaluasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-100">
                    <XCircle size={12} /> Di Bawah Target
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Nama Peserta</span>
                <h3 className="text-base font-black text-gray-950 tracking-tight mt-0.5">{exam.student_name}</h3>
                <p className="text-sm font-bold text-blue-600 mt-1">{exam.exam_title || "Try Out Bulanan Berkas"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50/70 border rounded-xl p-3 font-mono">
                <div className="text-center border-r border-slate-200/60">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Skor Anak</p>
                  <p className="text-xl font-black text-gray-950 mt-0.5">{exam.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Ambang Batas</p>
                  <p className="text-xl font-bold text-slate-500 mt-0.5">{exam.passing_grade || 75}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{new Date(exam.exam_date).toLocaleDateString("id-ID")}</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Clock size={14} />
                <span>{exam.duration || "90"} Menit</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}