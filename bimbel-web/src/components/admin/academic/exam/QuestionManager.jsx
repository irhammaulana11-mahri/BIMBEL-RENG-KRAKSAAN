import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function QuestionManager({ exam, onBack }) {
  const [questions, setQuestions] = useState([
    { id: 1, question: "Berapakah hasil dari 2x + 5 = 15?", option_a: "5", option_b: "10", option_c: "15", option_d: "20", correct_answer: "a", score: 10 }
  ]);
  const [formOpen, setFormOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", score: 10 });

  const handleAddQuestion = (e) => {
    e.preventDefault();
    setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
    setFormOpen(false);
    setNewQuestion({ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", score: 10 });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Ujian
        </button>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Soal: {exam.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Mata Pelajaran: {exam.subject_name}</p>
          </div>
          <button onClick={() => setFormOpen(!formOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Tambah Soal
          </button>
        </div>

        {/* Form Input Soal Baru */}
        {formOpen && (
          <form onSubmit={handleAddQuestion} className="mb-6 p-6 border bg-gray-50/50 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pertanyaan Soal</label>
              <textarea required value={newQuestion.question} onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})} className="w-full rounded-xl border p-3 text-sm h-20" placeholder="Tulis butir pertanyaan..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Pilihan A</label><input type="text" required value={newQuestion.option_a} onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Pilihan B</label><input type="text" required value={newQuestion.option_b} onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Pilihan C</label><input type="text" required value={newQuestion.option_c} onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Pilihan D</label><input type="text" required value={newQuestion.option_d} onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kunci Jawaban Benar</label>
                <select value={newQuestion.correct_answer} onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm bg-white">
                  <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Bobot Skor Soal</label><input type="number" required value={newQuestion.score} onChange={(e) => setNewQuestion({...newQuestion, score: parseInt(e.target.value)})} className="w-full rounded-xl border px-3 py-2 text-sm" /></div>
            </div>
            <button type="submit" className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl">Simpan Soal</button>
          </form>
        )}

        {/* Daftar List Soal Aktif */}
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-5 border border-gray-100 bg-white rounded-2xl shadow-xs flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">Soal Nomor {idx + 1} (Skor: {q.score})</span>
                <p className="font-semibold text-gray-900 pt-1">{q.question}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-600">
                  <p><strong className="text-gray-400">A.</strong> {q.option_a}</p><p><strong className="text-gray-400">B.</strong> {q.option_b}</p>
                  <p><strong className="text-gray-400">C.</strong> {q.option_c}</p><p><strong className="text-gray-400">D.</strong> {q.option_d}</p>
                </div>
                <p className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block">Kunci Jawaban: {q.correct_answer.toUpperCase()}</p>
              </div>
              <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}