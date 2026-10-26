import React, { useEffect, useState } from "react";
import { Award, TrendingUp, BookOpen, MessageSquare } from "lucide-react";
import api from "../../api/axios";


export default function ParentGradesPage() {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGrades = async () => {
      try {
        setLoading(true);
        const res = await api.get("/parent/grades-report");
        setReportCards(res.data?.data || res.data || []);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadGrades();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Perkembangan Nilai</h1>
        <p className="text-base text-gray-500 mt-1">Laporan berkala hasil evaluasi belajar, skor ujian berkala, dan ulasan tentor.</p>
      </div>

      {reportCards.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 italic">
          Belum ada rekapan nilai rapor akademik yang diterbitkan untuk saat ini.
        </div>
      )}

      <div className="space-y-6">
        {reportCards.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Header Raport Anak */}
            <div className="p-5 bg-gray-50/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-950 tracking-tight">{report.student?.student_name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Periode Evaluasi: {report.period_name}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl text-blue-700 text-sm font-bold">
                <TrendingUp size={16} /> Rata-Rata: <span className="font-mono text-base font-black">{report.average_score}</span>
              </div>
            </div>

            {/* List Nilai Per Mapel */}
            <div className="p-5">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap pb-2">
                      <th className="pb-3 w-1/2">Mata Pelajaran</th>
                      <th className="pb-3 text-center">Nilai Tugas</th>
                      <th className="pb-3 text-center">Nilai Ujian</th>
                      <th className="pb-3 text-center">Capaian Huruf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                    {report.details?.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50/30">
                        <td className="py-3.5 flex items-center gap-2 text-gray-900 font-bold">
                          <BookOpen size={16} className="text-gray-400" /> {detail.subject_name}
                        </td>
                        <td className="py-3.5 text-center font-mono font-bold text-gray-600">{detail.assignment_score}</td>
                        <td className="py-3.5 text-center font-mono font-bold text-gray-900">{detail.exam_score}</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono font-bold text-xs">{detail.grade_letter}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan / Keterangan Tentor Wali */}
              <div className="mt-5 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <MessageSquare size={14} /> Catatan Perkembangan Akademik
                </div>
                <p className="text-sm font-medium text-gray-700 leading-relaxed italic">
                  "{report.teacher_notes || 'Siswa menunjukkan motivasi belajar yang konsisten sepanjang periode bimbingan.'}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}