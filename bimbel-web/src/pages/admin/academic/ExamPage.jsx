import React, { useEffect, useState } from "react";
import { Plus, Search, ClipboardCheck, Send, PenLine } from "lucide-react";
import ExamTable from "../../../components/admin/academic/exam/ExamTable";
import ExamModal from "../../../components/admin/academic/exam/ExamModal";
import QuestionManager from "../../../components/admin/academic/exam/QuestionManager";
import ExamResultList from "../../../components/admin/academic/exam/ExamResultList";
import ConfirmationModal from "../../../components/ui/confirmation/ConfirmationModal";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { getSubjects } from "@/services/admin/subjectService";
import {
  getExams, createExam, updateExam, deleteExam, changeExamStatus, getApiErrorMessage,
} from "@/services/exam/examService";

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

const STATUS_ACTION = {
  PUBLISHED: { title: "Terbitkan Ujian?", message: "Ujian yang terbit dapat dipilih tentor di sesi KBM dan dikerjakan siswa sesuai jadwal.", variant: "success" },
  ARCHIVED: { title: "Arsipkan Ujian?", message: "Ujian yang diarsipkan tidak dapat dipilih lagi untuk sesi maupun dikerjakan siswa. Hasil yang ada tetap tersimpan.", variant: "warning" },
};

export default function ExamPage() {
  const [exams, setExams] = useState([]);
  const [summary, setSummary] = useState({ total: 0, published: 0, pending: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();

  // State Pencarian & Filter
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // State Kontrol Sub-Halaman
  const [viewMode, setViewMode] = useState("list");
  const [currentExamTarget, setCurrentExamTarget] = useState(null);

  const fetchExams = async () => {
    try {
      const res = await getExams({ keyword: search, subject_id: subjectFilter, status: statusFilter, page, per_page: 15 });
      setExams(res.data.data || []);
      setSummary(res.data.summary || {});
      setPagination(res.data.meta || { current_page: 1, last_page: 1 });
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat data ujian."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSubjects({ perPage: 100 }).then(res => setSubjects(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewMode !== "list") return;
    const timer = setTimeout(fetchExams, 300);
    return () => clearTimeout(timer);
  }, [search, subjectFilter, statusFilter, page, viewMode]);

  const handleAdd = () => {
    setSelectedExam(null);
    setModalOpen(true);
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam);
    setModalOpen(true);
  };

  // Dipanggil ExamModal; error dilempar kembali agar modal menampilkannya
  const handleSubmit = async (formData) => {
    if (selectedExam) await updateExam(selectedExam.id, formData);
    else await createExam(formData);
    setModalOpen(false);
    showSuccess(selectedExam ? "Ujian berhasil diperbarui." : "Ujian berhasil dibuat. Tambahkan soal lalu terbitkan.");
    fetchExams();
  };

  const runAction = async (action, successMessage) => {
    setConfirmConfig({ open: false });
    try {
      await action();
      showSuccess(successMessage);
      fetchExams();
    } catch (err) {
      showError(getApiErrorMessage(err, "Aksi gagal dijalankan."));
    }
  };

  const handleDelete = (exam) => {
    setConfirmConfig({
      open: true,
      title: "Hapus Ujian?",
      message: `"${exam.title}" beserta seluruh soalnya akan dihapus. Ujian yang sudah dikerjakan siswa tidak dapat dihapus.`,
      variant: "danger",
      onConfirm: () => runAction(() => deleteExam(exam.id), "Ujian berhasil dihapus."),
    });
  };

  const handleChangeStatus = (exam, status) => {
    setConfirmConfig({
      open: true,
      ...STATUS_ACTION[status],
      onConfirm: () => runAction(() => changeExamStatus(exam.id, status), "Status ujian diperbarui."),
    });
  };

  if (viewMode === "questions") {
    return <QuestionManager exam={currentExamTarget} onBack={() => setViewMode("list")} />;
  }

  if (viewMode === "results") {
    return <ExamResultList exam={currentExamTarget} onBack={() => setViewMode("list")} />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Exam Management</h1>
            <p className="text-gray-500">Kelola master ujian, bank soal, dan penilaian hasil ujian online siswa</p>
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
          <PremiumStatCard title="Total Bank Ujian" value={summary.total ?? 0} desc="Seluruh ujian yang dibuat" icon={ClipboardCheck} colorClass="bg-slate-50 text-slate-600" />
          <PremiumStatCard title="Ujian Terbit" value={summary.published ?? 0} desc="Siap dipakai di sesi / jadwal" icon={Send} colorClass="bg-green-50 text-green-700" />
          <PremiumStatCard title="Menunggu Nilai Essay" value={summary.pending ?? 0} desc="Hasil siswa yang perlu dinilai" icon={PenLine} colorClass="bg-amber-50 text-amber-700" />
        </div>

        {/* Filter & Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/30">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari judul kuis/ujian..."
                className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-end shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border px-4 py-2.5 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Terbit</option>
                <option value="ARCHIVED">Arsip</option>
              </select>
              <select
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                className="rounded-xl border px-4 py-2.5 bg-white text-sm text-gray-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-center text-sm text-gray-400">Memuat data ujian...</p>
          ) : (
            <ExamTable
              data={exams}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onChangeStatus={handleChangeStatus}
              onManageQuestions={(exam) => { setCurrentExamTarget(exam); setViewMode("questions"); }}
              onViewResults={(exam) => { setCurrentExamTarget(exam); setViewMode("results"); }}
            />
          )}

          {pagination.last_page > 1 && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 text-sm">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">Sebelumnya</button>
              <span className="text-gray-500">Hal {pagination.current_page} / {pagination.last_page}</span>
              <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">Berikutnya</button>
            </div>
          )}
        </div>

        <ExamModal open={modalOpen} onClose={() => setModalOpen(false)} data={selectedExam} onSubmit={handleSubmit} />

        <ConfirmationModal
          open={confirmConfig.open}
          title={confirmConfig.title}
          message={confirmConfig.message}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig({ open: false })}
        />
      </div>
    </div>
  );
}
