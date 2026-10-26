import React from "react";
import { ArrowLeft, Award, CheckCircle } from "lucide-react";

export default function ExamResultList({ exam, onBack }) {
  // Simulasi record dari table exam_results
  const mockResults = [
    { id: 1, student_name: "Analuam Mahri", total_correct: 8, total_questions: 10, score: 80 },
    { id: 2, student_name: "Ahmad Dani", total_correct: 10, total_questions: 10, score: 100 },
    { id: 3, student_name: "Wulan Dari", total_correct: 5, total_questions: 10, score: 50 }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Ujian
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hasil Nilai Ujian: {exam.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor performa kelulusan siswa bimbel</p>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
                <th className="p-5">Nama Lengkap Siswa</th>
                <th className="p-5 text-center">Jawaban Benar</th>
                <th className="p-5 text-center">Nilai Akhir</th>
                <th className="p-5 text-center">Status Kelulusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {mockResults.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50/50">
                  <td className="p-5 font-bold text-gray-900">{res.student_name}</td>
                  <td className="p-5 text-center font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> {res.total_correct} / {res.total_questions} Soal
                    </span>
                  </td>
                  <td className="p-5 text-center font-mono font-bold text-lg text-gray-900">{res.score}</td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      res.score >= 70 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    }`}>
                      {res.score >= 70 ? "Lulus KKM" : "Remedial"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}