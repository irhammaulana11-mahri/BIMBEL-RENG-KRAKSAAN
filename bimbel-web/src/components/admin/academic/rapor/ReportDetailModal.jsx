import React, { useEffect, useState } from "react";
import { X, Save, Send, Undo2 } from "lucide-react";
import ReportCardView from "@/components/report/ReportCardView";
import { getProgressReportDetail, saveGeneralNote, REPORT_STATUS } from "@/services/academic/progressReportService";
import RecommendationEditor from "./RecommendationEditor";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatPeriod } from "@/utils/format";

/**
 * Detail rapor bulanan siswa untuk Admin: pratinjau, catatan umum, terbit/tarik.
 * onPublish/onUnpublish ditangani halaman (dengan konfirmasi), lalu modal dimuat ulang lewat reloadKey.
 */
export default function ReportDetailModal({ target, period, reloadKey, onClose, onPublish, onUnpublish, onNoteSaved }) {
  const [report, setReport] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    if (!target) return;
    setReport(null);
    setError("");
    getProgressReportDetail({ period, class_id: target.class_id, student_id: target.student_id })
      .then((res) => {
        setReport(res.data.data);
        setNote(res.data.data.general_note || "");
        setAiEnabled(!!res.data.ai_enabled);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat rapor.")));
  }, [target, period, reloadKey]);

  if (!target) return null;

  const isDraft = report?.status !== "PUBLISHED";
  const noteChanged = (report?.general_note || "") !== note;

  const handleSaveNote = async () => {
    setSaving(true);
    setError("");
    try {
      await saveGeneralNote({ period, class_id: target.class_id, student_id: target.student_id, general_note: note });
      setReport({ ...report, general_note: note.trim() || null });
      onNoteSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan catatan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Rapor Bulanan</span>
            {report && <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${REPORT_STATUS[report.status]?.className}`}>{REPORT_STATUS[report.status]?.label}</span>}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{target.student_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatPeriod(period)} • {target.class_name}{report?.published_at && ` • terbit ${report.published_at}`}</p>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!report && !error && <p className="text-center text-sm text-gray-400 py-10">Memuat rapor...</p>}

          {report && (
            <>
              {isDraft && <p className="text-xs bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-3 py-2">Draft: angka dihitung langsung dari absensi & hasil ujian. Saat diterbitkan, angka dibekukan dan rapor terlihat oleh orang tua & siswa.</p>}
              <ReportCardView report={isDraft ? { ...report, general_note: null, ai_recommendation: null } : report} />

              {isDraft && (
                <RecommendationEditor
                  target={target}
                  period={period}
                  value={report.ai_recommendation}
                  aiEnabled={aiEnabled}
                  onChange={(rec) => setReport((prev) => ({ ...prev, ai_recommendation: rec }))}
                />
              )}

              {isDraft && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Catatan Umum Bimbel (opsional)</label>
                  <textarea rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan dari bimbel untuk orang tua..." className="w-full rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={handleSaveNote} disabled={saving || !noteChanged} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
                    <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Catatan"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {report && (
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
            {isDraft ? (
              <button onClick={() => onPublish(target, noteChanged)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Terbitkan Rapor
              </button>
            ) : (
              <button onClick={() => onUnpublish({ ...target, report_id: report.report_id })} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-1.5">
                <Undo2 className="w-4 h-4" /> Tarik ke Draft
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
