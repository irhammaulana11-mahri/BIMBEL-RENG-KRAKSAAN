import React, { useState } from "react";
import { Search, Calendar, Send, User, CheckCircle, AlertCircle, TrendingUp, BookOpen, MessageSquare } from "lucide-react";
import StudentReportList from "../../../components/admin/academic/rapor/StudentReportList";
import ReportDetailModal from "../../../components/admin/academic/rapor/ReportDetailModal";

const PremiumStatCard = ({ title, value, desc, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{desc}</p>
    </div>
    <div className={`p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function ProgressReportPage() {
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState("semester"); // 'semester' atau 'monthly'
  const [semesterFilter, setSemesterFilter] = useState("2026-ganjil"); // Default semester berjalan
  const [monthFilter, setMonthFilter] = useState("2026-07");

  // MOCK DATA: Kompilasi data siswa berdasarkan gabungan data attendance dan exam_results
  const [mockReports] = useState([
    {
      id: 1,
      student_name: "Rian Mahri",
      class_name: "12 IPA Unggulan",
      parent_name: "Analuam Mahri",
      phone: "081913311558",
      attendance_percentage: 92,
      total_meetings: 12,
      present_count: 11,
      average_exam_score: 85,
      exam_trend: "up", // Naik
      exam_history: [
        { title: "Kuis Matematika 01", score: 75 },
        { title: "Kuis Fisika 02", score: 80 },
        { title: "Tryout UTBK Akbar 1", score: 85 },
        { title: "Evaluasi Kimia Bab 3", score: 90 }
      ],
      tutor_feedbacks: [
        { tutor_name: "Budi Santoso, S.Pd.", subject: "Matematika", note: "Rian sangat fokus memahami konsep turunan kalkulus. Pertahankan keaktifannya di kelas." },
        { tutor_name: "Dewi Lestari, M.Pd.", subject: "Fisika", note: "Pemahaman rumus gelombang baik, hanya perlu lebih teliti pada konversi satuan hitung." }
      ]
    },
    {
      id: 2,
      student_name: "Siti Badriah",
      class_name: "10 IPS Reguler",
      parent_name: "Desi",
      phone: "08234567890",
      attendance_percentage: 75,
      total_meetings: 8,
      present_count: 6,
      average_exam_score: 68,
      exam_trend: "down", // Turun
      exam_history: [
        { title: "Kuis Sosiologi 01", score: 78 },
        { title: "Kuis Geografi 01", score: 70 },
        { title: "Evaluasi Sejarah UTBK", score: 62 }
      ],
      tutor_feedbacks: [
        { tutor_name: "Dewi Lestari, M.Pd.", subject: "Sosiologi", note: "Siti sempat absen 2 kali karena sakit. Perlu ada sesi mengejar ketertinggalan materi struktur sosial." }
      ]
    }
  ]);

  const handleSendReportWA = (report) => {
    alert(`Mengirim Link Laporan Grafis Rapor Perkembangan Bulan ${monthFilter} Siswa: ${report.student_name} ke WhatsApp Orang Tua (${report.phone})`);
  };

  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const filteredReports = mockReports.filter(r =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) || 
    r.class_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Student Progress Report</h1>
          <p className="text-gray-500">Kompilasi otomatis rapor kehadiran, tren nilai kuis, dan evaluasi pengajaran siswa</p>
        </div>

        {/* Dashboard Ringkasan Atas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PremiumStatCard title="Rata-rata Kehadiran Siswa" value="83.5%" desc="Total Kehadiran / Total Siswa" icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
          <PremiumStatCard title="Rata-rata Nilai Kuis" value="76.5" desc="Total Nilai" icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
          <PremiumStatCard title="Total Feedback Tentor" value="3" desc="Tentor memberikan feedback" icon={MessageSquare} colorClass="bg-purple-50 text-purple-600" />
        </div>

        {/* Kontrol Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/30">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
  
            {/* Toggle Switcher Periode */}
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                type="button"
                onClick={() => setPeriodType("semester")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    periodType === "semester" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                }`}
                >
                Semesteran
                </button>
                <button
                type="button"
                onClick={() => setPeriodType("monthly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    periodType === "monthly" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                }`}
                >
                Bulanan
                </button>
            </div>

            {/* Input Filter dinamis berdasarkan tipe periode yang dipilih */}
            {periodType === "semester" ? (
                <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-medium text-gray-700"
                >
                <option value="2026-ganjil">2026/2027 - Semester Ganjil</option>
                <option value="2026-genap">2025/2026 - Semester Genap</option>
                </select>
            ) : (
                <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-medium text-gray-700"
                />
            )}

            {/* Input Search Nama Siswa */}
            <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Search className="w-4 h-4" />
                </span>
                <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
            </div>
            </div>
          </div>

          {/* Render List Komponen Tabel */}
          <StudentReportList 
            data={filteredReports} 
            onOpenDetail={handleOpenDetail} 
            onSendWA={handleSendReportWA} 
          />
        </div>
      </div>

      {/* Modal Detail Rapor */}
      <ReportDetailModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        report={selectedReport} 
        month={monthFilter}
      />
    </div>
  );
}