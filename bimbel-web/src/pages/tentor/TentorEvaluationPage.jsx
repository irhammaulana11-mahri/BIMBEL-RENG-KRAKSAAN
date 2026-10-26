import React from "react";

export default function TentorEvaluationPage() {
  const reports = [
    { id: "ev1", subject: "Ilmu Pengetahuan Sosial", assessment: "Quiz Mobilitas Sosial", avgScore: "88.5", status: "Selesai Dinilai" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Evaluasi & Nilai</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rekapitulasi hasil penilaian kuis dan ujian siswa.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase">
            <tr>
              <th className="p-4">Mata Pelajaran</th>
              <th className="p-4">Jenis Assessment</th>
              <th className="p-4 text-center">Rata-rata Nilai Kelas</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-semibold">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-gray-900">{r.subject}</td>
                <td className="p-4 text-indigo-600">{r.assessment}</td>
                <td className="p-4 text-center font-black text-base text-gray-800">{r.avgScore}</td>
                <td className="p-4 text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-black">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}