import React from "react";
import { X, Calendar, CheckCircle, Award, MessageSquare, TrendingUp } from "lucide-react";

export default function ReportDetailModal({ open, onClose, report, month }) {
  if (!open || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        {/* Header Modal */}
        <div className="mb-6">
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
            Laporan Grafik Bulanan
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{report.student_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Periode Evaluasi: {month} | Kelas: {report.class_name}</p>
        </div>

        <div className="space-y-6">
          
          {/* SECTION 1: GRAFIK PRESENTASE KEHADIRAN (PROGRESS BAR VISUAL) */}
          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-600" /> 1. Grafik Persentase Kehadiran
            </h3>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner flex">
                <div 
                  className={`h-full transition-all duration-500 ${
                    report.attendance_percentage >= 80 ? "bg-green-500" : "bg-amber-500"
                  }`} 
                  style={{ width: `${report.attendance_percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                <p>Total Presensi Kehadiran: <span className="text-gray-900 font-bold">{report.present_count} Sesi</span></p>
                <p className="font-bold text-gray-900 text-sm">{report.attendance_percentage}% Hadir</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: GRAFIK TREN NILAI KUIS / UJIAN (BAR CHART SIMULATION) */}
          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> 2. Tren Nilai Kuis & Tryout Siswa
            </h3>
            
            {/* Visualisasi Mini Bar Chart menggunakan CSS Grid flex */}
            <div className="flex items-end justify-around h-32 border-b border-gray-200 pb-1 px-4 gap-2">
              {report.exam_history.map((exam, index) => (
                <div key={index} className="flex flex-col items-center w-full group">
                  {/* Tooltip Angka Nilai */}
                  <span className="text-[10px] font-bold text-blue-600 mb-1 opacity-100 bg-blue-50 px-1.5 py-0.5 rounded">
                    {exam.score}
                  </span>
                  {/* Tiang Batang Grafik */}
                  <div 
                    className="w-8 bg-blue-500/80 hover:bg-blue-600 rounded-t-md transition-all duration-300"
                    style={{ height: `${exam.score}%` }}
                  />
                </div>
              ))}
            </div>
            
            {/* Label Judul Ujian di bawah batang grafik */}
            <div className="flex justify-around items-start text-[10px] text-gray-400 text-center font-medium mt-2">
              {report.exam_history.map((exam, index) => (
                <p key={index} className="w-full line-clamp-1 px-1" title={exam.title}>
                  {exam.title}
                </p>
              ))}
            </div>
          </div>

          {/* SECTION 3: CATATAN EVALUASI & FEEDBACK DESKRIPTIF TENTOR */}
          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" /> 3. Feedback Deskriptif Tentor Pengampu
            </h3>
            <div className="space-y-3">
              {report.tutor_feedbacks.map((fb, index) => (
                <div key={index} className="p-3 bg-white border border-gray-100 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center text-xs font-bold text-purple-600">
                    <p>👨‍🏫 {fb.tutor_name}</p>
                    <span className="px-2 py-0.5 bg-purple-50 rounded text-[10px] uppercase">{fb.subject}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 italic leading-relaxed">
                    "{fb.note}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}