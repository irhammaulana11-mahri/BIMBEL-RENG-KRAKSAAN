import React, { useCallback, useEffect, useState } from "react";
import { X, ChevronRight, CalendarDays } from "lucide-react";
import ReportCardView, { TrendBadge, PredicateBadge } from "./ReportCardView";
import SemesterDetailModal from "@/components/admin/academic/rapor/SemesterDetailModal";
import {
  getPublishedReports, getPublishedReport, getPublishedSemesters, getPublishedSemesterDetail,
  TERMS, currentTerm, academicYearOptions, formatScore, formatPercent,
} from "@/services/academic/progressReportService";
import { getApiErrorMessage } from "@/utils/apiError";

/**
 * Rapor terbit untuk orang tua (role "parent", bisa filter anak) dan siswa (role "student").
 */
export default function PublishedReportsBrowser({ role }) {
  const [mode, setMode] = useState("monthly");
  const [reports, setReports] = useState([]);
  const [children, setChildren] = useState([]);
  const [childFilter, setChildFilter] = useState("");
  const [semester, setSemester] = useState(currentTerm());
  const [semesterRows, setSemesterRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openReport, setOpenReport] = useState(null);
  const [semesterTarget, setSemesterTarget] = useState(null);

  const childParams = role === "parent" && childFilter ? { student_id: childFilter } : {};

  useEffect(() => {
    setLoading(true);
    setError("");
    const request = mode === "monthly"
      ? getPublishedReports(role, childParams).then((res) => {
          setReports(res.data.data || []);
          if (res.data.children) setChildren(res.data.children);
        })
      : getPublishedSemesters(role, { ...semester, ...childParams }).then((res) => setSemesterRows(res.data.data || []));

    request
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat rapor.")))
      .finally(() => setLoading(false));
  }, [role, mode, childFilter, semester]);

  // Siswa tidak mengirim student_id (rapor dirinya sendiri)
  const semesterLoader = useCallback(
    ({ student_id, ...params }) => getPublishedSemesterDetail(role, role === "parent" ? { ...params, student_id } : params),
    [role]
  );

  const showChildName = role === "parent" && children.length > 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {[["monthly", "Bulanan"], ["semester", "Semester"]].map(([value, label]) => (
            <button key={value} onClick={() => setMode(value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{label}</button>
          ))}
        </div>
        {mode === "semester" && (
          <>
            <select value={semester.academic_year} onChange={(e) => setSemester({ ...semester, academic_year: Number(e.target.value) })} className="rounded-xl border px-3 py-2 text-sm bg-white">
              {academicYearOptions().map((y) => <option key={y} value={y}>{y}/{y + 1}</option>)}
            </select>
            <select value={semester.term} onChange={(e) => setSemester({ ...semester, term: e.target.value })} className="rounded-xl border px-3 py-2 text-sm bg-white">
              {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </>
        )}
        {showChildName && (
          <select value={childFilter} onChange={(e) => setChildFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm bg-white">
            <option value="">Semua anak</option>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <p className="p-10 text-center text-sm text-gray-400">Memuat rapor...</p>
      ) : mode === "monthly" ? (
        reports.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-sm text-gray-400">Belum ada rapor yang diterbitkan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <button key={r.report_id} onClick={() => setOpenReport(r)} className="text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {r.period.label}</p>
                    <p className="font-black text-gray-900 mt-0.5">{role === "parent" ? r.student.name : r.class.name}</p>
                    <p className="text-xs text-gray-500">{role === "parent" ? r.class.name : `Terbit ${r.published_at}`}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-50 rounded-xl p-3 text-center">
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase">Kehadiran</p><p className="font-black text-gray-900">{formatPercent(r.attendance_percentage)}</p></div>
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase">Rata-rata</p><p className="font-black text-gray-900">{formatScore(r.exam_average)}</p></div>
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase">Tren</p><div className="mt-0.5"><TrendBadge trend={r.exam_trend} /></div></div>
                </div>
                <div className="mt-2"><PredicateBadge score={r.exam_average} /></div>
              </button>
            ))}
          </div>
        )
      ) : semesterRows.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-sm text-gray-400">Belum ada rapor terbit pada semester ini.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {semesterRows.map((row) => (
            <button key={`${row.class.id}-${row.student.id}`} onClick={() => setSemesterTarget({ student_id: row.student.id, student_name: row.student.name, class_id: row.class.id, class_name: row.class.name })} className="text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-indigo-400 transition-colors">
              <p className="text-xs font-bold text-indigo-500 uppercase">{row.label}</p>
              <p className="font-black text-gray-900 mt-0.5">{role === "parent" ? row.student.name : row.class.name}</p>
              <p className="text-xs text-gray-500">{role === "parent" && `${row.class.name} • `}{row.months_count} rapor bulanan</p>
              <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 rounded-xl p-3 text-center">
                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Kehadiran</p><p className="font-black text-gray-900">{formatPercent(row.attendance.percentage)}</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Rata-rata Nilai</p><p className="font-black text-gray-900">{formatScore(row.exam.average)}</p></div>
              </div>
            </button>
          ))}
        </div>
      )}

      <MonthlyReportModal role={role} summary={openReport} onClose={() => setOpenReport(null)} />
      <SemesterDetailModal target={semesterTarget} semester={semester} loader={semesterLoader} onClose={() => setSemesterTarget(null)} />
    </div>
  );
}

function MonthlyReportModal({ role, summary, onClose }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!summary) return;
    setReport(null);
    setError("");
    getPublishedReport(role, summary.report_id)
      .then((res) => setReport(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat rapor.")));
  }, [role, summary]);

  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Rapor {summary.period.label}</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{summary.student.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{summary.class.name} • diterbitkan {summary.published_at}</p>
        </div>
        <div className="p-6 overflow-y-auto">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!report && !error && <p className="text-center text-sm text-gray-400 py-10">Memuat rapor...</p>}
          {report && <ReportCardView report={report} />}
        </div>
      </div>
    </div>
  );
}
