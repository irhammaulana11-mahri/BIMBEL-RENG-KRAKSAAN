import React, { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, MinusCircle, PenLine } from "lucide-react";
import { getApiErrorMessage } from "@/services/exam/examService";

const TYPE_LABEL = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar / Salah",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Essay",
};

const formatAnswer = (item, value) => {
  if (value === null || value === undefined || value === "") return null;
  if (item.question_type === "TRUE_FALSE") return value === "TRUE" ? "Benar" : "Salah";
  if (item.question_type === "MULTIPLE_CHOICE") {
    const option = item.options.find(o => o.key === value);
    return option ? `${value}. ${option.text}` : value;
  }
  if (item.question_type === "SHORT_ANSWER") return value.split("|").join(" / ");
  return value;
};

/**
 * Detail jawaban siswa + penilaian essay. Dipakai Admin dan Tentor.
 * fetchDetail(resultId) & gradeResult(resultId, payload) mengembalikan promise axios.
 */
export default function ExamResultDetailModal({ open, resultId, onClose, fetchDetail, gradeResult, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyDetail = (data) => {
    setDetail(data);
    setFeedback(data.feedback || "");
    setGrades(Object.fromEntries(
      data.answers
        .filter(a => a.question_type === "ESSAY" && a.answer_id && a.answer)
        .map(a => [a.answer_id, { score: a.needs_grading ? "" : a.score, feedback: a.teacher_feedback || "" }])
    ));
  };

  useEffect(() => {
    if (!open || !resultId) return;
    setLoading(true);
    setError("");
    fetchDetail(resultId)
      .then(res => applyDetail(res.data.data))
      .catch(err => setError(getApiErrorMessage(err, "Gagal memuat hasil ujian.")))
      .finally(() => setLoading(false));
  }, [open, resultId]);

  if (!open) return null;

  const essayIds = Object.keys(grades);
  const allEssayFilled = essayIds.every(id => grades[id].score !== "" && grades[id].score !== null);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        grades: essayIds
          .filter(id => grades[id].score !== "" && grades[id].score !== null)
          .map(id => ({ answer_id: id, score: Number(grades[id].score), feedback: grades[id].feedback || null })),
        feedback: feedback || null,
      };
      const res = await gradeResult(resultId, payload);
      applyDetail(res.data.data);
      if (onSaved) onSaved(res.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan penilaian."));
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = detail?.status === "GRADED"
    ? "bg-green-50 text-green-700"
    : "bg-amber-50 text-amber-700";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">{detail?.student_name || "Hasil Ujian"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {detail?.exam_title} {detail?.class_name ? `• ${detail.class_name}` : ""} {detail?.submitted_at ? `• Dikumpulkan ${detail.submitted_at} WIB` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        {loading || !detail ? (
          <div className="p-12 text-center text-sm text-gray-400">{error || "Memuat jawaban siswa..."}</div>
        ) : (
          <>
            <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 bg-slate-50 border-b border-gray-100">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Status</p><span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${statusBadge}`}>{detail.status === "GRADED" ? "Sudah Dinilai" : "Menunggu Nilai Essay"}</span></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Nilai</p><p className="text-xl font-black text-gray-900">{detail.score} <span className="text-xs text-gray-400">/ {detail.total_score}</span></p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Benar / Salah</p><p className="text-sm font-bold text-gray-800 mt-1">{detail.total_correct} / {detail.total_wrong}</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase">Tidak Dijawab</p><p className="text-sm font-bold text-gray-800 mt-1">{detail.total_unanswered}</p></div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {detail.answers.map((item, index) => {
                const studentAnswer = formatAnswer(item, item.answer);
                const isEssay = item.question_type === "ESSAY";
                const grade = item.answer_id ? grades[item.answer_id] : null;

                return (
                  <div key={item.question_id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-400">#{index + 1}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">{TYPE_LABEL[item.question_type]}</span>
                      <span className="ml-auto text-xs font-bold text-gray-500">{item.score} / {item.max_score} poin</span>
                      {item.is_correct === true && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {item.is_correct === false && <XCircle className="w-4 h-4 text-red-500" />}
                      {item.needs_grading && <MinusCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 whitespace-pre-line">{item.question}</p>

                    <div className="mt-3 text-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Jawaban Siswa</p>
                      <p className={`mt-0.5 whitespace-pre-line ${studentAnswer ? "text-gray-800" : "text-gray-400 italic"}`}>{studentAnswer || "Tidak dijawab"}</p>
                    </div>

                    {!isEssay && (
                      <p className="mt-2 text-xs font-semibold text-green-700">Kunci: {formatAnswer(item, item.correct_answer)}</p>
                    )}

                    {isEssay && item.essay_answer && (
                      <div className="mt-2 text-xs bg-green-50 border border-green-100 rounded-lg p-2 text-green-800 whitespace-pre-line">
                        <span className="font-bold">Pedoman: </span>{item.essay_answer}
                      </div>
                    )}

                    {isEssay && grade && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                        <div className="shrink-0">
                          <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><PenLine size={12}/> Nilai (0-{item.max_score})</label>
                          <input
                            type="number" min={0} max={item.max_score} step="0.5" value={grade.score}
                            onChange={e => setGrades({ ...grades, [item.answer_id]: { ...grade, score: e.target.value } })}
                            className="mt-1 w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Catatan untuk siswa</label>
                          <input
                            type="text" value={grade.feedback}
                            onChange={e => setGrades({ ...grades, [item.answer_id]: { ...grade, feedback: e.target.value } })}
                            className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white" placeholder="Opsional"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Catatan Umum untuk Siswa</label>
                <textarea rows={2} value={feedback} onChange={e => setFeedback(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="Opsional" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3 shrink-0">
              {error && <p className="text-sm font-medium text-red-600 mr-auto">{error}</p>}
              {!error && essayIds.length > 0 && !allEssayFilled && <p className="text-xs text-amber-700 mr-auto">Nilai baru tampil ke siswa setelah semua essay dinilai.</p>}
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600">Tutup</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan Penilaian"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
