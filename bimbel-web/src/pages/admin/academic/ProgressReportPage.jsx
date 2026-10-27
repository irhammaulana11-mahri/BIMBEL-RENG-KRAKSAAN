import React, { useEffect, useState } from "react";
import { Search, CheckCircle, TrendingUp, MessageSquare, Eye, FileCheck2 } from "lucide-react";
import StudentReportList from "../../../components/admin/academic/rapor/StudentReportList";
import ReportDetailModal from "../../../components/admin/academic/rapor/ReportDetailModal";
import SemesterDetailModal from "../../../components/admin/academic/rapor/SemesterDetailModal";
import ConfirmationModal from "../../../components/ui/confirmation/ConfirmationModal";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import {
  getProgressReports, publishProgressReports, unpublishProgressReport,
  getSemesterReports, getSemesterReportDetail,
  TERMS, currentTerm, academicYearOptions, formatScore, formatPercent,
} from "@/services/academic/progressReportService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatPeriod, currentPeriod } from "@/utils/format";

const PremiumStatCard = ({ title, value, desc, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{desc}</p>
    </div>
    <div className={`p-4 rounded-2xl ${colorClass}`}><Icon className="w-6 h-6" /></div>
  </div>
);

export default function ProgressReportPage() {
  const [periodType, setPeriodType] = useState("monthly");
  const [period, setPeriod] = useState(currentPeriod());
  const [semester, setSemester] = useState(currentTerm());
  const [filters, setFilters] = useState({ keyword: "", class_id: "", status: "" });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [semesterRows, setSemesterRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailReload, setDetailReload] = useState(0);
  const [semesterDetail, setSemesterDetail] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchMonthly = async () => {
    try {
      const res = await getProgressReports({ period, ...filters });
      setRows(res.data.data || []);
      setSummary(res.data.summary);
      setClasses(res.data.classes || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat rapor."));
    } finally {
      setLoading(false);
    }
  };

  const fetchSemester = async () => {
    try {
      const res = await getSemesterReports({ ...semester, keyword: filters.keyword, class_id: filters.class_id });
      setSemesterRows(res.data.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat rekap semester."));
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => (periodType === "monthly" ? fetchMonthly() : fetchSemester());

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(refresh, 300);
    return () => clearTimeout(timer);
  }, [periodType, period, semester, filters]);

  const runConfirmed = (config, action) => {
    setConfirm({
      open: true,
      ...config,
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          const message = await action();
          showSuccess(message);
          setDetailReload((n) => n + 1);
          fetchMonthly();
        } catch (err) {
          showError(getApiErrorMessage(err, "Proses gagal."));
        }
      },
    });
  };

  const handlePublish = (row, unsavedNote = false) => runConfirmed({
    title: "Terbitkan Rapor?",
    message: `Rapor ${formatPeriod(period)} untuk ${row.student_name} akan dibekukan dan terlihat oleh orang tua & siswa.${unsavedNote ? " Catatan umum yang belum disimpan akan diabaikan." : ""}`,
    variant: "success",
  }, async () => {
    const res = await publishProgressReports({ period, class_id: row.class_id, student_ids: [row.student_id] });
    return res.data.message;
  });

  const handlePublishClass = () => {
    const className = classes.find((c) => c.id === filters.class_id)?.name;
    const drafts = rows.filter((r) => r.status === "DRAFT").length;
    runConfirmed({
      title: "Terbitkan Semua Rapor Kelas?",
      message: `${drafts} rapor draft di kelas ${className} periode ${formatPeriod(period)} akan diterbitkan sekaligus. Pastikan catatan tentor sudah lengkap.`,
      variant: "success",
    }, async () => {
      const res = await publishProgressReports({ period, class_id: filters.class_id });
      return res.data.message;
    });
  };

  const handleUnpublish = (row) => runConfirmed({
    title: "Tarik Rapor ke Draft?",
    message: `Rapor ${row.student_name} tidak lagi terlihat oleh orang tua & siswa sampai diterbitkan ulang. Angka akan dihitung ulang dari data terbaru.`,
    variant: "warning",
  }, async () => {
    const res = await unpublishProgressReport(row.report_id);
    return res.data.message;
  });

  const draftCount = rows.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Student Progress Report</h1>
          <p className="text-gray-500">Rapor bulanan otomatis dari kehadiran & nilai ujian, dilengkapi catatan tentor per mapel. Orang tua & siswa melihat rapor setelah diterbitkan.</p>
        </div>

        {periodType === "monthly" && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <PremiumStatCard title="Rata-rata Kehadiran" value={formatPercent(summary.average_attendance)} desc={`${summary.students} siswa • ${formatPeriod(period)}`} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
            <PremiumStatCard title="Rata-rata Nilai Ujian" value={formatScore(summary.average_exam)} desc="Skala 0-100, ujian yang sudah dinilai" icon={TrendingUp} colorClass="bg-blue-50 text-blue-600" />
            <PremiumStatCard title="Catatan Tentor" value={`${summary.notes_filled}/${summary.notes_expected}`} desc={`${summary.published} terbit • ${summary.draft} draft`} icon={MessageSquare} colorClass="bg-purple-50 text-purple-600" />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-gray-100 bg-gray-50/30">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                {[["monthly", "Bulanan"], ["semester", "Semesteran"]].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setPeriodType(value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${periodType === value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{label}</button>
                ))}
              </div>

              {periodType === "monthly" ? (
                <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white font-medium text-gray-700" />
              ) : (
                <>
                  <select value={semester.academic_year} onChange={(e) => setSemester({ ...semester, academic_year: Number(e.target.value) })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white font-medium text-gray-700">
                    {academicYearOptions().map((y) => <option key={y} value={y}>{y}/{y + 1}</option>)}
                  </select>
                  <select value={semester.term} onChange={(e) => setSemester({ ...semester, term: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white font-medium text-gray-700">
                    {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </>
              )}

              <select value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                <option value="">Semua Kelas</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {periodType === "monthly" && (
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                  <option value="">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Terbit</option>
                </select>
              )}

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Cari nama siswa..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-white" />
              </div>
            </div>

            {periodType === "monthly" && (
              <button
                onClick={handlePublishClass}
                disabled={!filters.class_id || draftCount === 0}
                title={!filters.class_id ? "Pilih kelas terlebih dahulu" : ""}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 shrink-0"
              >
                <FileCheck2 className="w-4 h-4" /> Terbitkan Semua di Kelas
              </button>
            )}
          </div>

          {periodType === "monthly" ? (
            <StudentReportList data={rows} loading={loading} onOpenDetail={setDetail} onPublish={(row) => handlePublish(row)} onUnpublish={handleUnpublish} />
          ) : (
            <SemesterTable rows={semesterRows} loading={loading} onOpen={(row) => setSemesterDetail({ student_id: row.student.id, student_name: row.student.name, class_id: row.class.id, class_name: row.class.name })} />
          )}
        </div>
      </div>

      <ReportDetailModal
        target={detail}
        period={period}
        reloadKey={detailReload}
        onClose={() => setDetail(null)}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onNoteSaved={() => { showSuccess("Catatan umum disimpan."); fetchMonthly(); }}
      />
      <SemesterDetailModal target={semesterDetail} semester={semester} loader={getSemesterReportDetail} onClose={() => setSemesterDetail(null)} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}

function SemesterTable({ rows, loading, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[720px]">
        <thead className="border-b border-gray-100 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-600">
          <tr><th className="p-4">Siswa / Kelas</th><th className="p-4 text-center">Rapor Terbit</th><th className="p-4 text-center">Kehadiran</th><th className="p-4 text-center">Rerata Nilai</th><th className="p-4 text-center">Aksi</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-gray-700">
          {loading ? (
            <tr><td colSpan={5} className="p-6 text-center text-gray-400">Memuat rekap...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5} className="p-6 text-center text-gray-400">Belum ada rapor bulanan yang terbit pada semester ini.</td></tr>
          ) : rows.map((row) => (
            <tr key={`${row.class.id}-${row.student.id}`} className="hover:bg-gray-50/50">
              <td className="p-4"><p className="font-bold text-gray-900">{row.student.name}</p><p className="text-xs text-gray-400">{row.class.name}</p></td>
              <td className="p-4 text-center"><span className="font-bold">{row.months_count}</span> <span className="text-xs text-gray-400">/ 6 bulan</span><p className="text-[10px] text-gray-400">{row.months.map((m) => m.label.split(" ")[0].slice(0, 3)).join(", ")}</p></td>
              <td className="p-4 text-center font-bold">{formatPercent(row.attendance.percentage)}<p className="text-[10px] text-gray-400 font-normal">{row.attendance.hadir}/{row.attendance.held_sessions} sesi</p></td>
              <td className="p-4 text-center font-bold">{formatScore(row.exam.average)}<p className="text-[10px] text-gray-400 font-normal">{row.exam.count} ujian</p></td>
              <td className="p-4 text-center">
                <button onClick={() => onOpen(row)} className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-xl inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Rekap</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
