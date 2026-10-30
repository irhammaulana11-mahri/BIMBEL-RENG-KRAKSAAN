import React, { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { requestAttendanceCorrection, getMyAttendanceCorrections } from "@/services/tentor/scheduleService";

const STATUSES = ["HADIR", "IZIN", "SAKIT", "ALPA"];
const STATUS_BADGE = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};
const STATUS_LABEL = { PENDING: "Menunggu admin", APPROVED: "Disetujui", REJECTED: "Ditolak" };

const firstError = (error, fallback) => {
  const errors = error.response?.data?.errors;
  return errors ? Object.values(errors)[0][0] : error.response?.data?.message || fallback;
};

export default function AttendanceCorrectionSection({ sessionId, student, refreshKey, onClose, onSubmitted, showSuccess, showError }) {
  const [rows, setRows] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    getMyAttendanceCorrections(sessionId).then((res) => setRows(res.data?.data || [])).catch(() => setRows([]));
  }, [sessionId]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { setNewStatus(""); setReason(""); }, [student?.id]);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await requestAttendanceCorrection(sessionId, { student_id: student.id, new_status: newStatus, reason: reason.trim() });
      showSuccess(res.data?.message || "Pengajuan koreksi terkirim.");
      onSubmitted();
      load();
    } catch (error) {
      showError(firstError(error, "Pengajuan koreksi gagal dikirim."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {rows.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-sm font-black text-gray-900 mb-3">Pengajuan koreksi Anda</h3>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="p-3 border border-gray-200 rounded-xl text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-gray-900">{r.student_name}: {r.old_status} → {r.new_status}</p>
                  <span className={`px-2 py-0.5 rounded-full border font-black text-[10px] ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>
                <p className="text-gray-500 mt-1">Alasan: {r.reason}</p>
                {r.review_note && <p className="text-gray-600 mt-1">Catatan admin: {r.review_note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">Ajukan koreksi absensi</h3>
                <p className="text-xs text-gray-500 mt-0.5">{student.full_name}: status saat ini <b>{student.attendance_status || "BELUM"}</b></p>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Tutup"><X size={18} /></button>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-1.5">Status yang benar</p>
              <div className="flex gap-1.5">
                {STATUSES.filter((s) => s !== student.attendance_status).map((s) => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black border ${newStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-1.5">Alasan (minimal 10 karakter)</p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={1000}
                placeholder="Jelaskan mengapa absensi perlu diubah..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-500" />
            </div>

            <p className="text-[11px] text-gray-500">Pengajuan ditinjau admin. Absensi baru berubah setelah disetujui.</p>

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-100">Batal</button>
              <button onClick={submit} disabled={saving || !newStatus || reason.trim().length < 10}
                className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Mengirim..." : "Kirim pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
