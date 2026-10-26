import React, { useState } from "react";
import { Plus, Search, Calendar, ClipboardCheck, Filter, Users } from "lucide-react";
import ExamTable from "../../../components/admin/academic/exam/ExamTable";
import ExamModal from "../../../components/admin/academic/exam/ExamModal";
import QuestionManager from "../../../components/admin/academic/exam/QuestionManager";
import ExamResultList from "../../../components/admin/academic/exam/ExamResultList";

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


export default function ExamPage() {
  const mockExamsData = [
    { id: 1, title: "Tryout UTBK Akbar 1 - Penalaran Matematika", subject_name: "Matematika Peminatan", tutor_name: "Budi Santoso, S.Pd.", exam_date: "2026-07-20", duration: 120, total_score: 100 },
    { id: 2, title: "Kuis Harian - Gelombang & Bunyi", subject_name: "Fisika Klasik", tutor_name: "Dewi Lestari, M.Pd.", exam_date: "2026-07-17", duration: 45, total_score: 100 },
    { id: 3, title: "Ujian Akhir Semester - English Grammar Proficiency", subject_name: "Bahasa Inggris", tutor_name: "Siti Nurhayati, S.Pd.", exam_date: "2026-07-25", duration: 90, total_score: 100 },
    { id: 4, title: "Kuis Kilat 03 - Struktur Sosial & Konflik", subject_name: "Sosiologi Dasar", tutor_name: "Dewi Lestari, M.Pd.", exam_date: "2026-07-16", duration: 30, total_score: 50 }
  ];

  const [exams, setExams] = useState(mockExamsData);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // State Pencarian & Filter
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateType, setDateType] = useState("all"); // 'all', 'daily', atau 'monthly'
  const [dateFilter, setDateFilter] = useState(""); // Nilai YYYY-MM-DD
  const [monthFilter, setMonthFilter] = useState(""); // Nilai YYYY-MM

  // State Kontrol Sub-Halaman
  const [viewMode, setViewMode] = useState("list");
  const [currentExamTarget, setCurrentExamTarget] = useState(null);

  const handleAdd = () => {
    setSelectedExam(null);
    setModalOpen(true);
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus ujian ini? Seluruh soal dan hasil nilai siswa terkait akan ikut terhapus.")) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (formData) => {
    // Logic API create/update
    setModalOpen(false);
  };

  // Logic Filtering Data di Sisi Client (Search, Subject, dan Tanggal/Bulanan)
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "" || exam.subject_id === parseInt(subjectFilter);
    
    let matchesDate = true;
    if (dateType === "daily" && dateFilter !== "") {
      matchesDate = exam.exam_date === dateFilter;
    } else if (dateType === "monthly" && monthFilter !== "") {
      // Mencocokkan format "YYYY-MM" dari tanggal ujian
      matchesDate = exam.exam_date.substring(0, 7) === monthFilter;
    }

    return matchesSearch && matchesSubject && matchesDate;
  });

  if (viewMode === "questions") {
    return <QuestionManager exam={currentExamTarget} onBack={() => setViewMode("list")} />;
  }

  if (viewMode === "results") {
    return <ExamResultList exam={currentExamTarget} onBack={() => setViewMode("list")} />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Exam Management</h1>
            <p className="text-gray-500">Kelola master kuis, kustomisasi bank soal, dan hasil nilai ujian siswa</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
          >
            <Plus className="w-5 h-5" />
            Buat Ujian Baru
          </button>
        </div>

        {/* Row Kumpulan Stat Cards (Standar Baru) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <PremiumStatCard 
            title="Total Bank Ujian" 
            value={exams.length} 
            desc="Jumlah paket soal terbit aktif" 
            icon={ClipboardCheck} 
            colorClass="bg-slate-50 text-slate-600" 
          />
          <PremiumStatCard 
            title="Ujian Terfilter" 
            value={filteredExams.length} 
            desc="Sesuai parameter pencarian" 
            icon={Filter} 
            colorClass="bg-blue-50 text-blue-700" 
          />
          <PremiumStatCard 
            title="Siswa Sudah Mengerjakan" 
            value={`${14}`} 
            desc="Telah mengumpulkan lembar jawaban" 
            icon={Users} 
            colorClass="bg-green-50 text-green-700" 
          />
        </div>

        {/* Filter & Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Baris Pertama Filter: Pencarian & Pilihan Filter Tanggal */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/30">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              
              {/* Toggle Tipe Tanggal */}
              <div className="flex bg-gray-200 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => { setDateType("all"); setDateFilter(""); setMonthFilter(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateType === "all" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500"
                  }`}
                >
                  Semua Waktu
                </button>
                <button
                  onClick={() => setDateType("daily")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateType === "daily" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500"
                  }`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setDateType("monthly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateType === "monthly" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500"
                  }`}
                >
                  Bulanan
                </button>
              </div>

              {/* Input Tanggal sesuai tipe yang dipilih */}
              {dateType === "daily" && (
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 shrink-0"
                />
              )}
              {dateType === "monthly" && (
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 shrink-0"
                />
              )}

              {/* Input Judul Pencarian */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul kuis/ujian..."
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Dropdown Filter Mata Pelajaran */}
            <div className="flex gap-3 justify-end shrink-0">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border px-4 py-2.5 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                <option value="10">Matematika Peminatan</option>
                <option value="12">Fisika Klasik</option>
                <option value="15">Bahasa Inggris</option>
                <option value="18">Sosiologi Dasar</option>
              </select>
            </div>
          </div>

          {/* Tabel Ujian Terfilter */}
          <ExamTable 
            data={filteredExams} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onManageQuestions={(exam) => { setCurrentExamTarget(exam); setViewMode("questions"); }}
            onViewResults={(exam) => { setCurrentExamTarget(exam); setViewMode("results"); }}
          />
        </div>

        <ExamModal open={modalOpen} onClose={() => setModalOpen(false)} data={selectedExam} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}