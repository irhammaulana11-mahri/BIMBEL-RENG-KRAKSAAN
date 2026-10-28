import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Clock, Send, CheckCircle2, XCircle, MinusCircle, Award, Hourglass, Cloud, CloudOff, Loader2,
} from "lucide-react";
import {
  getStudentExamResult, saveStudentAnswer, submitStudentExam, getApiErrorMessage,
} from "@/services/exam/examService";

const TYPE_LABEL = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar / Salah",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Essay",
};

const TEXT_SAVE_DELAY = 800;

const formatClock = (seconds) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

const isAnswered = (value) => value !== undefined && value !== null && String(value).trim() !== "";

export default function StudentExamAttemptPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    return getStudentExamResult(resultId)
      .then(res => { setData(res.data.data); setError(""); })
      .catch(err => setError(getApiErrorMessage(err, "Ujian tidak ditemukan.")))
      .finally(() => setLoading(false));
  }, [resultId]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat ujian...</div>;

  if (error && !data) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm font-bold text-rose-600">{error}</p>
        <button onClick={() => navigate("/student/exams")} className="text-sm font-bold text-indigo-600">Kembali ke daftar ujian</button>
      </div>
    );
  }

  return data.mode_view === "ATTEMPT"
    ? <ExamAttempt data={data} onFinished={load} />
    : <ExamResultView data={data} />;
}

/* ============================== MENGERJAKAN ============================== */

function ExamAttempt({ data, onFinished }) {
  const [answers, setAnswers] = useState(() => ({ ...data.answers }));
  const [current, setCurrent] = useState(0);
  const [saveState, setSaveState] = useState({}); // questionId -> saving | saved | error
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Hitung mundur berdasarkan jam perangkat agar tidak bergeser saat tab tidak aktif
  const deadline = useRef(Date.now() + data.remaining_seconds * 1000);
  const [remaining, setRemaining] = useState(data.remaining_seconds);
  const timers = useRef({});
  const pending = useRef({});
  const submittedRef = useRef(false);

  const questions = data.questions;
  const question = questions[current];
  const answeredCount = questions.filter(q => isAnswered(answers[q.id])).length;

  const persist = useCallback(async (questionId, value) => {
    setSaveState(prev => ({ ...prev, [questionId]: "saving" }));
    const request = saveStudentAnswer(data.result_id, questionId, value);
    pending.current[questionId] = request;
    try {
      await request;
      setSaveState(prev => ({ ...prev, [questionId]: "saved" }));
    } catch (err) {
      setSaveState(prev => ({ ...prev, [questionId]: "error" }));
      const msg = getApiErrorMessage(err, "Jawaban gagal disimpan. Periksa koneksi Anda.");
      setMessage(msg);
      // Ujian sudah ditutup server (waktu habis / sudah dikumpulkan)
      if (err.response?.status === 422 && /habis|dikumpulkan/i.test(msg)) onFinished();
    } finally {
      delete pending.current[questionId];
    }
  }, [data.result_id, onFinished]);

  const setAnswer = (questionId, value, isText) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    clearTimeout(timers.current[questionId]);
    if (isText) {
      timers.current[questionId] = setTimeout(() => {
        delete timers.current[questionId];
        persist(questionId, value);
      }, TEXT_SAVE_DELAY);
    } else {
      persist(questionId, value);
    }
  };

  // Simpan jawaban isian/essay yang masih menunggu debounce, lalu tunggu semua request
  const flushSaves = async () => {
    Object.entries(timers.current).forEach(([questionId, timer]) => {
      clearTimeout(timer);
      delete timers.current[questionId];
      persist(questionId, answers[questionId] ?? null);
    });
    await Promise.allSettled(Object.values(pending.current));
  };

  const submit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      await flushSaves();
      await submitStudentExam(data.result_id);
      onFinished();
    } catch (err) {
      if (auto) {
        // Waktu habis: server menutup ujian otomatis, cukup muat hasilnya
        onFinished();
        return;
      }
      // Gagal (mis. koneksi): izinkan siswa mencoba lagi
      submittedRef.current = false;
      setSubmitting(false);
      setMessage(getApiErrorMessage(err, "Gagal mengumpulkan ujian. Coba lagi."));
    }
  }, [data.result_id, onFinished, answers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.round((deadline.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        submit(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [submit]);

  // Peringatan saat menutup tab selagi masih ada jawaban yang belum tersimpan
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(timers.current).length || Object.keys(pending.current).length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const lowTime = remaining <= 60;
  const state = saveState[question.id];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* HEADER + TIMER */}
      <div className="sticky top-0 z-20 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-black text-gray-900 truncate">{data.exam_title}</h1>
          <p className="text-xs font-bold text-gray-400 uppercase">{data.subject_name} • {answeredCount}/{questions.length} terjawab</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black ${lowTime ? "bg-rose-600 text-white animate-pulse" : "bg-slate-900 text-white"}`}>
            <Clock size={18}/> {formatClock(remaining)}
          </div>
          <button onClick={() => setConfirmOpen(true)} disabled={submitting} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50">
            <Send size={16}/> {submitting ? "Mengumpulkan..." : "Kumpulkan"}
          </button>
        </div>
      </div>

      {data.description && current === 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-900 whitespace-pre-line">{data.description}</div>
      )}

      {message && <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-sm font-bold text-rose-700">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        {/* SOAL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-black text-gray-400">Soal {current + 1} dari {questions.length}</span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-black uppercase">{TYPE_LABEL[question.question_type]}</span>
            <span className="text-[10px] font-bold text-gray-400">{question.score} poin</span>
            <span className="ml-auto text-[11px] font-bold flex items-center gap-1">
              {state === "saving" && <><Loader2 size={13} className="animate-spin text-gray-400"/> <span className="text-gray-400">Menyimpan...</span></>}
              {state === "saved" && <><Cloud size={13} className="text-emerald-500"/> <span className="text-emerald-600">Tersimpan</span></>}
              {state === "error" && <><CloudOff size={13} className="text-rose-500"/> <span className="text-rose-600">Gagal disimpan</span></>}
            </span>
          </div>

          <p className="text-base font-semibold text-gray-900 whitespace-pre-line mb-6">{question.question}</p>

          {(question.question_type === "MULTIPLE_CHOICE" || question.question_type === "TRUE_FALSE") && (
            <div className="space-y-2">
              {question.options.map(option => {
                const selected = answers[question.id] === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setAnswer(question.id, option.key, false)}
                    disabled={submitting}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"}`}
                  >
                    {question.question_type === "MULTIPLE_CHOICE" && (
                      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>{option.key}</span>
                    )}
                    <span className={`text-sm ${selected ? "font-bold text-indigo-900" : "text-gray-800"}`}>{option.text}</span>
                  </button>
                );
              })}
              {isAnswered(answers[question.id]) && (
                <button onClick={() => setAnswer(question.id, null, false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Kosongkan jawaban</button>
              )}
            </div>
          )}

          {question.question_type === "SHORT_ANSWER" && (
            <input
              type="text" value={answers[question.id] || ""} disabled={submitting}
              onChange={e => setAnswer(question.id, e.target.value, true)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl p-3 text-sm outline-none" placeholder="Ketik jawaban singkat..."
            />
          )}

          {question.question_type === "ESSAY" && (
            <textarea
              rows={8} value={answers[question.id] || ""} disabled={submitting}
              onChange={e => setAnswer(question.id, e.target.value, true)}
              className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl p-3 text-sm outline-none" placeholder="Tulis jawaban Anda..."
            />
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 flex items-center gap-1 disabled:opacity-30"><ArrowLeft size={16}/> Sebelumnya</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1">Berikutnya <ArrowRight size={16}/></button>
            ) : (
              <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Send size={16}/> Kumpulkan</button>
            )}
          </div>
        </div>

        {/* NAVIGASI SOAL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm h-max">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Navigasi Soal</p>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrent(index)}
                className={`h-9 rounded-lg text-xs font-black border-2 ${index === current ? "border-indigo-600" : "border-transparent"} ${saveState[q.id] === "error" ? "bg-rose-100 text-rose-700" : isAnswered(answers[q.id]) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-[11px] font-bold text-gray-500">
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-600"/> Terjawab</p>
            <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 border"/> Belum dijawab</p>
          </div>
        </div>
      </div>

      {/* KONFIRMASI KUMPUL */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-gray-900">Kumpulkan ujian?</h3>
            <p className="text-sm text-gray-600">
              Anda menjawab <strong>{answeredCount}</strong> dari <strong>{questions.length}</strong> soal.
              {answeredCount < questions.length && <> Masih ada <strong className="text-rose-600">{questions.length - answeredCount} soal kosong</strong>.</>}
              {" "}Jawaban tidak dapat diubah setelah dikumpulkan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-700">Periksa Lagi</button>
              <button onClick={() => submit(false)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold">Ya, Kumpulkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== HASIL ============================== */

function ExamResultView({ data }) {
  const navigate = useNavigate();
  const isGraded = data.status === "GRADED";

  const formatAnswer = (item, value) => {
    if (!isAnswered(value)) return null;
    if (item.question_type === "TRUE_FALSE") return value === "TRUE" ? "Benar" : "Salah";
    if (item.question_type === "MULTIPLE_CHOICE") {
      const option = item.options.find(o => o.key === value);
      return option ? `${value}. ${option.text}` : value;
    }
    if (item.question_type === "SHORT_ANSWER") return value.split("|").join(" / ");
    return value;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <button onClick={() => navigate("/student/exams")} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600">
        <ArrowLeft size={16}/> Kembali ke Ujian
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase">{data.subject_name}</p>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">{data.exam_title}</h1>
        <p className="text-xs text-gray-500 mt-1">Dikumpulkan {data.submitted_at} WIB</p>

        {isGraded ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1 bg-indigo-600 text-white rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase opacity-80 flex items-center gap-1"><Award size={12}/> Nilai</p>
              <p className="text-3xl font-black">{data.score}<span className="text-sm opacity-70"> / {data.total_score}</span></p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4"><p className="text-[10px] font-bold text-emerald-700 uppercase">Benar</p><p className="text-2xl font-black text-emerald-800">{data.total_correct}</p></div>
            <div className="bg-rose-50 rounded-2xl p-4"><p className="text-[10px] font-bold text-rose-700 uppercase">Salah</p><p className="text-2xl font-black text-rose-800">{data.total_wrong}</p></div>
            <div className="bg-gray-50 rounded-2xl p-4"><p className="text-[10px] font-bold text-gray-500 uppercase">Kosong</p><p className="text-2xl font-black text-gray-700">{data.total_unanswered}</p></div>
          </div>
        ) : (
          <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <Hourglass className="text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">Jawaban Anda sudah diterima. Nilai dan pembahasan akan tampil setelah tentor menilai jawaban essay.</p>
          </div>
        )}

        {isGraded && data.feedback && (
          <div className="mt-4 bg-slate-50 rounded-xl p-3 text-sm text-gray-700"><span className="font-bold">Catatan tentor: </span>{data.feedback}</div>
        )}
      </div>

      <div className="space-y-3">
        {data.answers.map((item, index) => {
          const studentAnswer = formatAnswer(item, item.answer);
          return (
            <div key={item.question_id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-black text-gray-400">#{index + 1}</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">{TYPE_LABEL[item.question_type]}</span>
                {data.show_review && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500">
                    {item.is_correct === true && <CheckCircle2 size={15} className="text-emerald-600"/>}
                    {item.is_correct === false && <XCircle size={15} className="text-rose-500"/>}
                    {item.is_correct === null && <MinusCircle size={15} className="text-amber-500"/>}
                    {item.score} / {item.max_score} poin
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 whitespace-pre-line">{item.question}</p>
              <div className="mt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Jawaban Anda</p>
                <p className={`text-sm whitespace-pre-line ${studentAnswer ? "text-gray-800" : "text-gray-400 italic"}`}>{studentAnswer || "Tidak dijawab"}</p>
              </div>
              {data.show_review && item.question_type !== "ESSAY" && item.is_correct !== true && (
                <p className="mt-2 text-xs font-bold text-emerald-700">Jawaban benar: {formatAnswer(item, item.correct_answer)}</p>
              )}
              {data.show_review && item.teacher_feedback && (
                <p className="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-gray-700"><span className="font-bold">Catatan tentor: </span>{item.teacher_feedback}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
