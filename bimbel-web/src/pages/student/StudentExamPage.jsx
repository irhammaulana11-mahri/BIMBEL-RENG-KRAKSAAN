import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, CalendarClock, Award, Hourglass, FileText } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { getStudentExams, startStudentExam, getApiErrorMessage } from "@/services/exam/examService";

export default function StudentExamPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ available: [], upcoming: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const { toast, showError, hideToast } = useToast();

  const fetchExams = () => getStudentExams()
    .then(res => setData(res.data.data))
    .catch(err => showError(getApiErrorMessage(err, "Gagal memuat daftar ujian.")))
    .finally(() => setLoading(false));

  useEffect(() => {
    fetchExams();
    // Segarkan berkala agar ujian yang baru dimulai tentor langsung muncul
    const interval = setInterval(fetchExams, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (item) => {
    if (item.result_id) {
      navigate(`/student/exams/${item.result_id}`);
      return;
    }
    setStarting(item.exam_id + (item.session_activity_id || ""));
    try {
      const res = await startStudentExam(item.exam_id, item.session_activity_id);
      navigate(`/student/exams/${res.data.data.result_id}`);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memulai ujian."));
      fetchExams();
    } finally {
      setStarting(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat ujian...</div>;

  return (
    <div className="page-card space-y-8 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <div>
        <h1 className="text-2xl font-black text-gray-900">Ujian & Hasil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kerjakan ujian yang sedang dibuka dan lihat hasil ujian Anda.</p>
      </div>

      {/* UJIAN TERSEDIA */}
      <section>
        <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Sedang Dibuka</h2>
        {data.available.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-sm font-bold text-gray-400">
            Tidak ada ujian yang sedang dibuka. Ujian sesi akan muncul saat tentor memulainya.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.available.map(item => {
              const key = item.exam_id + (item.session_activity_id || "");
              return (
                <div key={key} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.mode === "SESSION" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {item.mode === "SESSION" ? "Sesi KBM" : "Terjadwal"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.subject_name}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">{item.title}</h3>
                  {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold text-gray-600">
                    <span className="flex items-center gap-1"><Clock size={13}/> {item.duration} menit</span>
                    <span className="flex items-center gap-1"><FileText size={13}/> {item.total_questions} soal</span>
                    {item.closes_at && <span className="flex items-center gap-1 text-rose-600"><CalendarClock size={13}/> Tutup {item.closes_at} WIB</span>}
                  </div>
                  <button
                    onClick={() => handleStart(item)}
                    disabled={starting === key}
                    className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <PlayCircle size={16}/> {item.result_id ? "Lanjutkan Ujian" : starting === key ? "Menyiapkan..." : "Mulai Ujian"}
                  </button>
                  {item.result_id && item.expires_at && <p className="text-[11px] text-center text-amber-700 font-bold mt-2">Batas waktu {item.expires_at} WIB</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AKAN DATANG */}
      {data.upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Akan Datang</h2>
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {data.upcoming.map(exam => (
              <div key={exam.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{exam.title}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">{exam.subject_name} • {exam.duration} menit</p>
                </div>
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1"><CalendarClock size={13}/> Dibuka {exam.opens_at?.replace("T", " ")} WIB</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RIWAYAT */}
      <section>
        <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Riwayat Hasil</h2>
        {data.history.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm font-bold text-gray-400">Belum ada ujian yang dikerjakan.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {data.history.map(r => (
              <button key={r.id} onClick={() => navigate(`/student/exams/${r.id}`)} className="w-full text-left p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.exam_title}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">{r.subject_name} • Dikumpulkan {r.submitted_at} WIB</p>
                </div>
                {r.status === "GRADED" ? (
                  <span className="flex items-center gap-1.5 text-lg font-black text-indigo-700"><Award size={18}/> {r.score} <span className="text-xs text-gray-400">/ {r.total_score}</span></span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"><Hourglass size={13}/> Menunggu penilaian</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
