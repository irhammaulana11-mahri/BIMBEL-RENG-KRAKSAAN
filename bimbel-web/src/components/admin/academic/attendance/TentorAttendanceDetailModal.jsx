import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, LogIn, LogOut, Navigation2, AlertTriangle, Hourglass, Pencil, Check, Lock } from "lucide-react";
import { saveTentorAttendance } from "@/services/academic/attendanceService";

const STATUS_OPTIONS = ["HADIR", "IZIN", "SAKIT", "ALPA"];

const formatMinutes = (minutes) => {
  if (!minutes || minutes <= 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} menit`;
  return `${hours} jam ${mins} menit`;
};

export default function TentorAttendanceDetailModal({ open, data, onClose, onSaved }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ attendance_status: "HADIR", checkin_time: "", checkout_time: "", note: "" });

  useEffect(() => {
    if (!open || !data) return;
    setIsEditing(false);
    setError("");
    setForm({
      attendance_status: STATUS_OPTIONS.includes(data.attendance_status) ? data.attendance_status : "HADIR",
      checkin_time: data.checkin_time || data.start_time || "",
      checkout_time: data.checkout_time || "",
      note: data.note || "",
    });
  }, [open, data]);

  if (!open || !data) return null;

  const isPresent = data.attendance_status === "HADIR";
  const isLocked = data.is_payroll_processed;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        attendance_status: form.attendance_status,
        checkin_time: form.attendance_status === "HADIR" ? form.checkin_time || null : null,
        checkout_time: form.attendance_status === "HADIR" ? form.checkout_time || null : null,
        note: form.note || null,
      };
      const res = await saveTentorAttendance(data.session_id, payload);
      if (onSaved) onSaved(res.data.data);
      setIsEditing(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0][0] : err.response?.data?.message || "Gagal menyimpan absensi tentor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* 🟢 HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Presensi Tentor</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 🟢 IDENTITAS SESI & TENTOR */}
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-black text-indigo-700 leading-tight">{data.tentor_name}</h2>
             <span className={`px-2 py-1 rounded text-[10px] font-black ${
              data.attendance_status === "HADIR" ? "bg-emerald-100 text-emerald-700" :
              data.attendance_status === "IZIN" ? "bg-blue-100 text-blue-700" :
              data.attendance_status === "SAKIT" ? "bg-amber-100 text-amber-700" :
              data.attendance_status === "ALPA" ? "bg-rose-100 text-rose-700" :
              "bg-gray-200 text-gray-600"
            }`}>
              {data.attendance_status}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold text-gray-900">{data.subject_name}</p>
              <p className="text-xs font-semibold text-gray-500">{data.class_name}</p>
            </div>

            <div className="flex items-center gap-4 pt-2">
               <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                 <Clock size={14} className="text-indigo-400"/> {data.start_time} - {data.end_time} WIB
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                 <Calendar size={14} className="text-indigo-400"/> {data.session_date || "Hari ini"}
               </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          /* 🟢 FORM KOREKSI ADMIN */
          <div className="p-5 bg-slate-50 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Status Kehadiran</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setForm({ ...form, attendance_status: status })}
                    className={`py-2 rounded-lg text-[10px] font-black border transition-colors ${
                      form.attendance_status === status ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {form.attendance_status === "HADIR" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Jam Masuk</label>
                  <input type="time" value={form.checkin_time} onChange={e => setForm({ ...form, checkin_time: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl p-2 text-xs font-bold outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Jam Keluar</label>
                  <input type="time" value={form.checkout_time} onChange={e => setForm({ ...form, checkout_time: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl p-2 text-xs font-bold outline-none focus:border-indigo-500 bg-white" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Catatan</label>
              <textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Alasan koreksi / keterangan izin..." className="w-full mt-1 border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-indigo-500 bg-white" />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5"><AlertTriangle size={14}/> {error}</p>
            )}
          </div>
        ) : isPresent ? (
          /* 🟢 LOG WAKTU & DURASI */
          <div className="p-5 bg-slate-50 space-y-4 flex-1 overflow-y-auto">

            {/* Log Masuk & Keluar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><LogIn size={12}/> LOG MASUK</p>
                <p className="text-sm font-black text-gray-800">{data.checkin_time ? `${data.checkin_time} WIB` : "-"}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><LogOut size={12}/> LOG KELUAR</p>
                <p className="text-sm font-black text-gray-800">{data.checkout_time ? `${data.checkout_time} WIB` : "Belum"}</p>
              </div>
            </div>

            {/* Durasi & Keterlambatan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><Hourglass size={12}/> DURASI</p>
                <p className="text-sm font-black text-indigo-700">{formatMinutes(data.teaching_minutes)}</p>
              </div>
              <div className={`p-3 rounded-xl border ${data.late_minutes > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><AlertTriangle size={12}/> TERLAMBAT</p>
                <p className={`text-sm font-black ${data.late_minutes > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {data.late_minutes > 0 ? formatMinutes(data.late_minutes) : "Tepat waktu"}
                </p>
              </div>
            </div>

            {data.note && (
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan</p>
                <p className="text-xs font-semibold text-gray-700">{data.note}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 flex-1">
            <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-3">
              <Navigation2 size={24} />
            </div>
            <p className="text-sm font-bold text-gray-600">Tidak ada log presensi.</p>
            <p className="text-xs text-gray-400 mt-1">
              {data.note || "Tentor belum melakukan absen atau statusnya bukan HADIR."}
            </p>
          </div>
        )}

        {/* 🟢 FOOTER */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 flex gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Check size={14}/> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors">
                Kembali
              </button>
              {isLocked ? (
                <span className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <Lock size={14}/> Sudah Payroll
                </span>
              ) : (
                <button onClick={() => setIsEditing(true)} className="flex-1 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Pencil size={14}/> {data.attendance_status === "BELUM ABSEN" ? "Isi Absensi" : "Koreksi"}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
