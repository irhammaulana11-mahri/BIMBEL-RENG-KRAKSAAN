import React, { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, ChevronUp, ChevronDown, Lock, CheckCircle2 } from "lucide-react";
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion, reorderQuestions, getApiErrorMessage,
} from "@/services/exam/examService";

const TYPE_LABEL = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar / Salah",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Essay",
};

const OPTION_KEYS = ["a", "b", "c", "d", "e"];

const emptyQuestion = {
  question_type: "MULTIPLE_CHOICE",
  question: "",
  option_a: "", option_b: "", option_c: "", option_d: "", option_e: "",
  correct_answer: "A",
  essay_answer: "",
  score: 1,
  is_active: true,
};

export default function QuestionManager({ exam, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ is_locked: false, total_score: 0 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchQuestions = async () => {
    const res = await getQuestions(exam.id);
    setQuestions(res.data.data || []);
    setMeta(res.data.meta || { is_locked: false, total_score: 0 });
  };

  useEffect(() => {
    fetchQuestions()
      .catch(err => setError(getApiErrorMessage(err, "Gagal memuat soal.")))
      .finally(() => setLoading(false));
  }, [exam.id]);

  const isLocked = meta.is_locked;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyQuestion);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    setForm({
      ...emptyQuestion,
      ...Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v ?? ""])),
      correct_answer: q.correct_answer ?? (q.question_type === "TRUE_FALSE" ? "TRUE" : "A"),
    });
    setError("");
    setFormOpen(true);
  };

  const changeType = (type) => {
    const defaults = { MULTIPLE_CHOICE: "A", TRUE_FALSE: "TRUE", SHORT_ANSWER: "", ESSAY: "" };
    setForm({ ...form, question_type: type, correct_answer: defaults[type] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, score: Number(form.score) };
      if (editingId) await updateQuestion(exam.id, editingId, payload);
      else await createQuestion(exam.id, payload);
      await fetchQuestions();
      setFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan soal."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q) => {
    setPendingDelete(null);
    try {
      await deleteQuestion(exam.id, q.id);
      await fetchQuestions();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menghapus soal."));
    }
  };

  const handleMove = async (index, direction) => {
    const ordered = [...questions];
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const previous = questions;
    setQuestions(ordered.map((q, i) => ({ ...q, order_no: i + 1 })));
    try {
      await reorderQuestions(exam.id, ordered.map(q => q.id));
    } catch (err) {
      setQuestions(previous);
      setError(getApiErrorMessage(err, "Gagal mengubah urutan soal."));
    }
  };

  const renderAnswerKey = (q) => {
    if (q.question_type === "MULTIPLE_CHOICE") return `Kunci: ${q.correct_answer}`;
    if (q.question_type === "TRUE_FALSE") return `Kunci: ${q.correct_answer === "TRUE" ? "Benar" : "Salah"}`;
    if (q.question_type === "SHORT_ANSWER") return `Kunci: ${q.correct_answer?.split("|").join(" / ")}`;
    return "Dinilai manual oleh tentor";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Ujian
        </button>

        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Soal: {exam.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Mata Pelajaran: {exam.subject_name} • {questions.length} soal • Total bobot {meta.total_score} poin (dikonversi ke skala {exam.total_score})
            </p>
          </div>
          {!isLocked && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
              <Plus className="w-4 h-4" /> Tambah Soal
            </button>
          )}
        </div>

        {isLocked && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Soal dikunci karena sudah ada siswa yang mengerjakan ujian ini.
          </div>
        )}

        {error && !formOpen && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        {/* Form Input Soal */}
        {formOpen && (
          <form onSubmit={handleSubmit} className="mb-6 p-6 border bg-gray-50/50 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_LABEL).map(([type, label]) => (
                <button
                  key={type} type="button" onClick={() => changeType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${form.question_type === type ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pertanyaan Soal</label>
              <textarea required value={form.question} onChange={(e) => setForm({...form, question: e.target.value})} className="w-full rounded-xl border p-3 text-sm h-20" placeholder="Tulis butir pertanyaan..." />
            </div>

            {form.question_type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Isi minimal pilihan A dan B. Klik huruf untuk menandai kunci jawaban.</p>
                {OPTION_KEYS.map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <button
                      type="button" onClick={() => setForm({...form, correct_answer: key.toUpperCase()})}
                      className={`w-9 h-9 shrink-0 rounded-lg text-xs font-black border ${form.correct_answer === key.toUpperCase() ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200"}`}
                      title="Tandai sebagai kunci jawaban"
                    >
                      {key.toUpperCase()}
                    </button>
                    <input
                      type="text" required={key === "a" || key === "b"} value={form[`option_${key}`]}
                      onChange={(e) => setForm({...form, [`option_${key}`]: e.target.value})}
                      className="w-full rounded-xl border px-3 py-2 text-sm" placeholder={`Pilihan ${key.toUpperCase()}${key === "a" || key === "b" ? "" : " (opsional)"}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {form.question_type === "TRUE_FALSE" && (
              <div className="flex gap-2">
                {[["TRUE", "Benar"], ["FALSE", "Salah"]].map(([value, label]) => (
                  <button
                    key={value} type="button" onClick={() => setForm({...form, correct_answer: value})}
                    className={`px-5 py-2 rounded-xl text-sm font-bold border ${form.correct_answer === value ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200"}`}
                  >
                    Kunci: {label}
                  </button>
                ))}
              </div>
            )}

            {form.question_type === "SHORT_ANSWER" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kunci Jawaban</label>
                <input type="text" required value={form.correct_answer} onChange={(e) => setForm({...form, correct_answer: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Contoh: Jakarta|DKI Jakarta" />
                <p className="text-xs text-gray-500 mt-1">Pisahkan beberapa jawaban yang benar dengan tanda |. Huruf besar/kecil diabaikan.</p>
              </div>
            )}

            {form.question_type === "ESSAY" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pedoman Penilaian (Opsional)</label>
                <textarea value={form.essay_answer} onChange={(e) => setForm({...form, essay_answer: e.target.value})} className="w-full rounded-xl border p-3 text-sm h-20" placeholder="Poin-poin jawaban yang diharapkan, untuk membantu tentor menilai." />
              </div>
            )}

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bobot Poin</label>
                <input type="number" min={1} max={100} required value={form.score} onChange={(e) => setForm({...form, score: e.target.value})} className="w-28 rounded-xl border px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} className="rounded" /> Soal aktif
              </label>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-gray-500 font-medium">Batal</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Soal"}
              </button>
            </div>
          </form>
        )}

        {/* Daftar Soal */}
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-400">Memuat soal...</p>
        ) : questions.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">Belum ada soal. Tambahkan soal sebelum menerbitkan ujian.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className={`p-5 border rounded-2xl flex gap-4 ${q.is_active ? "border-gray-100 bg-white" : "border-dashed border-gray-200 bg-gray-50 opacity-70"}`}>
                {!isLocked && (
                  <div className="flex flex-col text-gray-300">
                    <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="hover:text-purple-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => handleMove(index, 1)} disabled={index === questions.length - 1} className="hover:text-purple-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-black text-gray-400">#{index + 1}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase">{TYPE_LABEL[q.question_type]}</span>
                    <span className="text-[10px] font-bold text-gray-400">{q.score} poin</span>
                    {!q.is_active && <span className="text-[10px] font-bold text-gray-400 uppercase">Nonaktif</span>}
                  </div>
                  <p className="font-semibold text-gray-900 whitespace-pre-line">{q.question}</p>
                  {q.question_type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                      {OPTION_KEYS.filter(k => q[`option_${k}`]).map(k => (
                        <div key={k} className={`p-2 rounded-lg border flex items-center gap-1.5 ${q.correct_answer === k.toUpperCase() ? "border-green-200 bg-green-50 text-green-800 font-semibold" : "border-gray-100"}`}>
                          {q.correct_answer === k.toUpperCase() && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {k.toUpperCase()}. {q[`option_${k}`]}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-green-700 font-semibold mt-2">{renderAnswerKey(q)}</p>
                </div>
                {!isLocked && (
                  <div className="flex items-start gap-1">
                    <button onClick={() => openEdit(q)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit"><Pencil className="w-4 h-4" /></button>
                    {pendingDelete === q.id ? (
                      <button onClick={() => handleDelete(q)} className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-lg">Yakin hapus?</button>
                    ) : (
                      <button onClick={() => setPendingDelete(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
