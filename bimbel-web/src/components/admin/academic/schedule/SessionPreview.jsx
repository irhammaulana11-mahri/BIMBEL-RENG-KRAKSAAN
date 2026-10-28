import React, { useEffect, useState } from "react";
import { 
  X, Clock, MapPin, User, Users, 
  RotateCcw, Edit3, XCircle, History, AlertTriangle, FileText
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import EditSessionDetailModal from "./EditSessionDetailModal"; // 🟢 Import Komponen Baru
import RescheduleModal from "./RescheduleModal"; // Pastikan path import sesuai
import { cancelSession, getSessionOverview } from "@/services/academic/scheduleService";
import StudentAttendanceModal from "../attendance/StudentAttendanceModal";
import Toast from "../../../../components/ui/Toast";
import { useToast } from "../../../../hooks/useToast";


export default function SessionPreview({ open, session, onClose, onActionComplete }) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isEditDetailOpen, setIsEditDetailOpen] = useState(false);
  
  // State untuk Modal Cancel
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [overview, setOverview] = useState(null);

  const { toast, showSuccess, showError, hideToast } = useToast();

  // Absensi, absen tentor, aktivitas & riwayat diambil dari database setiap drawer dibuka
  const loadOverview = () => {
    if (!session?.id) return;
    getSessionOverview(session.id).then((res) => setOverview(res.data.data)).catch(() => setOverview(null));
  };
  useEffect(() => {
    setOverview(null);
    if (open) loadOverview();
  }, [open, session?.id, session?.status]);

  if (!open || !session) return null;

  const isCompleted = session.status === "COMPLETED";
  const notStarted = ["SCHEDULED", "RESCHEDULED", "PREPARING"].includes(session.status);
  const isRunning = session.status === "IN_PROGRESS";
  const att = overview?.attendance;

  // Format tanggal menjadi: Senin, 20 Juli 2026
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "EEEE, dd MMMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ONGOING":
      case "IN_PROGRESS": return <span className="bg-blue-100 text-blue-700 border-blue-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">Sedang Berlangsung</span>;
      case "COMPLETED": return <span className="bg-emerald-100 text-emerald-700 border-emerald-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">Selesai</span>;
      case "CANCELLED": return <span className="bg-rose-100 text-rose-700 border-rose-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">Dibatalkan</span>;
      case "RESCHEDULED": return <span className="bg-amber-100 text-amber-700 border-amber-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">Dipindah</span>;
      default: return <span className="bg-slate-100 text-slate-700 border-slate-200 border px-2 py-0.5 rounded text-[10px] font-black uppercase">Dijadwalkan</span>;
    }
  };

  // Handler Batalkan Sesi
  const handleCancelSession = async () => {
    if (!cancelReason.trim()) {
        showError("Alasan pembatalan wajib diisi!");
        return;
    }
    
    try {
        setIsSubmitting(true);
        await cancelSession(session.id, { reason: cancelReason });
        showSuccess("Sesi berhasil dibatalkan.");
        
        if (onActionComplete) onActionComplete();
        setIsCancelConfirmOpen(false);
        onClose();
    } catch (error) {
        showError(error.response?.data?.message || "Gagal membatalkan sesi.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-sm transition-opacity animate-in fade-in duration-200" />
        <Toast {...toast} onClose={hideToast} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[450px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* HEADER DRAWER */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/80 relative shrink-0">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl transition-all cursor-pointer shadow-sm">
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            {session.meeting_no && (
              <span className="text-[11px] font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                Meeting {session.meeting_no}
              </span>
            )}
            {getStatusBadge(session.status)}
          </div>
          
          <h2 className="text-2xl font-black text-gray-950 tracking-tight leading-tight">
            {session.subject_name}
          </h2>
          <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-wide">
            {session.class_name} • <span className="text-blue-600">{session.class_type}</span>
          </p>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-white">
          
          {/* KELOMPOK 1: IDENTITAS SESI */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Waktu Pelaksanaan</p>
                <p className="text-sm font-bold text-gray-900">{formatDateDisplay(session.session_date)}</p>
                <p className="text-xs font-mono font-bold text-gray-500">{session.start_time} - {session.end_time} WIB</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                <User size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tentor Pengampu</p>
                <p className="text-sm font-bold text-gray-900">{session.tentor_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-rose-600" />
              </div>
              <div className="truncate pr-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Lokasi / Ruang</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {overview?.location || session.room_name || session.location_name || "-"}
                </p>
                {session.meeting_url && (
                    <a href={session.meeting_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline break-all mt-0.5 block">
                        {session.meeting_url}
                    </a>
                )}
              </div>
            </div>
          </div>

          {/* KELOMPOK 2: ABSENSI SISWA (data nyata) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5">
                <Users size={14} className="text-blue-600"/> Absensi Siswa
              </h3>
              {att && (
                <span className={`text-[10px] font-bold ${att.filled >= att.total_students && att.total_students > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {att.filled}/{att.total_students} siswa terisi
                </span>
              )}
            </div>
            {!overview ? <p className="text-xs text-gray-400 py-2">Memuat absensi...</p> : (
              <>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    ["Hadir", att.hadir, "bg-emerald-50 border-emerald-100 text-emerald-700"],
                    ["Izin", att.izin, "bg-blue-50 border-blue-100 text-blue-700"],
                    ["Sakit", att.sakit, "bg-amber-50 border-amber-100 text-amber-700"],
                    ["Alpa", att.alpa, "bg-rose-50 border-rose-100 text-rose-700"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className={`p-2 rounded-lg border ${cls}`}>
                      <div className="font-bold">{label}</div>
                      <div className="font-black text-lg">{value}</div>
                    </div>
                  ))}
                </div>
                {overview.students.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {overview.students.map((st, i) => (
                      <div key={i} className="flex justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                        <span className="font-semibold text-gray-800">{st.name}</span>
                        <span className="font-bold text-gray-500">{st.status === "BELUM" ? "Belum diabsen" : st.status}{st.note ? ` • ${st.note}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
                {notStarted && <p className="text-[11px] text-gray-400 mt-2">Absensi siswa diisi tentor setelah absen masuk di Ruang Kerja Sesi.</p>}
              </>
            )}
          </div>

          {/* KELOMPOK 3: ABSEN TENTOR */}
          {overview?.tentor_attendance && (
            <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-1">
              <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5"><User size={14} className="text-amber-600" /> Absen Tentor</h3>
              <p className="text-sm font-bold text-gray-900">Masuk {overview.tentor_attendance.checkin_time || "-"} • Pulang {overview.tentor_attendance.checkout_time || "-"} WIB</p>
              {overview.tentor_attendance.target_label && <p className="text-xs text-gray-500">Titik absen: {overview.tentor_attendance.target_label}</p>}
              {overview.tentor_attendance.remarks.length > 0 && (
                <p className="text-xs font-semibold text-amber-700">{overview.tentor_attendance.remarks.join(" • ")}</p>
              )}
            </div>
          )}

          {/* KELOMPOK 4: AKTIVITAS */}
          {overview && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5"><FileText size={14} className="text-indigo-500" /> Aktivitas Pertemuan ({overview.activities.length})</h3>
              {overview.activities.length === 0 ? <p className="text-xs text-gray-400">Belum ada aktivitas yang disusun tentor.</p> : overview.activities.map((a, i) => (
                <div key={i} className="flex justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                  <span className="font-semibold text-gray-800">{a.title}</span>
                  <span className="text-gray-500">{{ MATERIAL: "Materi", EXAM: "Ujian", DISCUSSION: "Diskusi", REVIEW: "Review" }[a.type] || a.type} • {{ READY: "Siap", IN_PROGRESS: "Berjalan", COMPLETED: "Selesai", CANCELLED: "Batal" }[a.status] || a.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* KELOMPOK 5: RIWAYAT SESI (dari data nyata) */}
          <div className="pt-2">
            <h3 className="text-xs font-black text-gray-800 uppercase mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <History size={14} className="text-gray-400"/> Riwayat Sesi
            </h3>
            <div className="relative pl-3 space-y-4 border-l-2 border-gray-100 ml-2">
              {(overview?.timeline || []).map((t, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${{ blue: "bg-blue-500", amber: "bg-amber-500", purple: "bg-purple-500", emerald: "bg-emerald-500", rose: "bg-rose-500" }[t.tone] || "bg-slate-400"}`}></div>
                  <p className="text-xs font-bold text-gray-800">{t.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t.at}{t.detail ? ` • ${t.detail}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER: tombol menyesuaikan status sesi */}
        <div className="p-5 border-t border-gray-100 bg-white space-y-2 shrink-0">
          {(isCompleted || isRunning) && (
            <button onClick={() => setIsAttendanceOpen(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl">
              <Users size={16} /> {isCompleted ? "Lihat / Koreksi Absensi Siswa" : "Lihat Absensi Siswa"}
            </button>
          )}
          {isRunning && <p className="text-[11px] text-center text-gray-500">Sesi sedang berlangsung dan dikelola tentor di Ruang Kerja Sesi.</p>}
          {session.status === "CANCELLED" && <p className="text-[11px] text-center text-gray-500">Sesi dibatalkan. Tidak ada aksi yang tersedia.</p>}

          {notStarted && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setIsEditDetailOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200">
                <FileText size={14} /> Edit Detail
              </button>
              <button onClick={() => setIsRescheduleOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] rounded-xl border border-amber-200">
                <RotateCcw size={14} /> Pindah Jadwal
              </button>
              <button onClick={() => setIsCancelConfirmOpen(true)} className="inline-flex flex-col items-center justify-center gap-1 p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-xl border border-rose-200">
                <XCircle size={14} /> Batalkan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RENDER MODAL PEMBATALAN DI ATAS DRAWER */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Batalkan Sesi?</h3>
                    </div>
                    <button onClick={() => setIsCancelConfirmOpen(false)} className="text-gray-400 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4 text-sm text-gray-600">
                    Anda akan membatalkan sesi:<br/>
                    <strong className="text-gray-900">{session.subject_name} ({session.class_name})</strong><br/>
                    {formatDateDisplay(session.session_date)} | {session.start_time} - {session.end_time}
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Alasan pembatalan <span className="text-rose-500">*</span></label>
                    <select 
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    >
                        <option value="">-- Pilih Alasan --</option>
                        <option value="Tentor berhalangan">Tentor berhalangan</option>
                        <option value="Permintaan siswa/kelas">Permintaan siswa/kelas</option>
                        <option value="Ruangan/Fasilitas bermasalah">Ruangan/Fasilitas bermasalah</option>
                        <option value="Lainnya">Lainnya...</option>
                    </select>
                </div>

                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-800 mb-6">
                    ⚠️ <strong>Sesi tidak akan dihapus dari sistem.</strong><br/>
                    Status sesi akan berubah menjadi <strong>DIBATALKAN</strong> dan tercatat di riwayat.
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setIsCancelConfirmOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                        Kembali
                    </button>
                    <button 
                        onClick={handleCancelSession}
                        disabled={!cancelReason.trim() || isSubmitting}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
                    >
                        {isSubmitting ? "Memproses..." : "Batalkan Sesi"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* RENDER WIZARD RESCHEDULE */}
      <EditSessionDetailModal 
        open={isEditDetailOpen} 
        session={session} 
        onClose={() => setIsEditDetailOpen(false)} 
        onSuccess={() => {
            setIsEditDetailOpen(false);
            if (onActionComplete) onActionComplete(); // Refresh data
        }}
      />
 <StudentAttendanceModal
        open={isAttendanceOpen}
        sessionId={session.id}
        onClose={() => setIsAttendanceOpen(false)}
        onSuccess={() => { setIsAttendanceOpen(false); loadOverview(); if (onActionComplete) onActionComplete(); }}
      />
      <RescheduleModal 
        open={isRescheduleOpen} 
        session={session} 
        onClose={() => setIsRescheduleOpen(false)} 
        onSuccess={() => {
            setIsRescheduleOpen(false);
            if (onActionComplete) onActionComplete();
        }}
      />
    </>
  );
}