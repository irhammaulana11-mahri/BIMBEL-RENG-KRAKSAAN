import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, MessageCircle, FileText, CheckCircle2, 
  ClipboardCheck, Plus, RefreshCw, ChevronUp, ChevronDown, Trash2, XCircle
} from "lucide-react";

// Asumsi Anda memiliki komponen ConfirmModal dan Toast reusable
import ConfirmationModal from "../ui/confirmation/ConfirmationModal";
import Toast from "../ui/Toast";
import { useToast } from "../../hooks/useToast";

import {
  getSessionWorkspace, saveSessionAttendance, endTentorSession, addSessionActivity,
  changeSessionActivityStatus, deleteSessionActivity, reorderSessionActivities,
} from "@/services/tentor/scheduleService";
import ActivityManagerModal from "./ActivityManagerModal"; // Komponen form terpisah

export default function TentorSessionWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("activities");
  
  // State Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  
  // State Data
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const { toast: toastState, showSuccess, showError, hideToast } = useToast();
  const toast = { success: showSuccess, error: showError };

  const getErrorMessage = (error, fallback) => {
    const errors = error.response?.data?.errors;
    return errors ? Object.values(errors)[0][0] : error.response?.data?.message || fallback;
  };

  const applyWorkspace = (data) => {
    setSession(data);
    const initialAttendance = {};
    const initialNotes = {};
    (data.students || []).forEach(s => {
      initialAttendance[s.id] = s.attendance_status || 'BELUM';
      initialNotes[s.id] = s.note || '';
    });
    setAttendanceData(initialAttendance);
    setAttendanceNotes(initialNotes);
  };

  const fetchWorkspace = async () => {
    const res = await getSessionWorkspace(id);
    applyWorkspace(res.data.data);
  };

  useEffect(() => {
    if (!id) return;
    fetchWorkspace()
      .catch(() => {
        showError("Gagal memuat data sesi.");
        navigate('/tentor/schedules');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-12 text-center text-sm font-bold text-gray-400 animate-pulse">Memuat Workspace...</div>;
  if (!session) return null;

  // Sesi selesai/dibatalkan terkunci: aktivitas & absensi tidak bisa diubah
  const isSessionCompleted = ['COMPLETED', 'CANCELLED'].includes(session.status);
  const canFillAttendance = session.status === 'IN_PROGRESS';

  // --- Helpers ---
  const getActivityIcon = (type) => {
    switch(type) {
      case 'MATERIAL': return <BookOpen size={16} className="text-blue-500" />;
      case 'DISCUSSION': return <MessageCircle size={16} className="text-purple-500" />;
      case 'EXAM': return <FileText size={16} className="text-rose-500" />;
      case 'REVIEW': return <RefreshCw size={16} className="text-amber-500" />;
      default: return <BookOpen size={16} className="text-gray-500" />;
    }
  };

  const getActivityTypeLabel = (type) => {
    switch(type) {
      case 'MATERIAL': return 'Materi';
      case 'DISCUSSION': return 'Diskusi';
      case 'EXAM': return 'Exam / Ujian';
      case 'REVIEW': return 'Review';
      default: return type;
    }
  };



  // --- Handlers ---
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    if (status === 'HADIR') setAttendanceNotes(prev => ({ ...prev, [studentId]: '' }));
  };

  const markAllPresent = () => {
    setAttendanceData(Object.fromEntries(session.students.map(s => [s.id, 'HADIR'])));
    setAttendanceNotes(Object.fromEntries(session.students.map(s => [s.id, ''])));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      await saveSessionAttendance(id, {
        attendances: session.students.map(s => ({
          student_id: s.id,
          attendance_status: attendanceData[s.id] || 'BELUM',
          note: attendanceNotes[s.id] || null,
        })),
      });
      await fetchWorkspace();
      toast.success("Absensi berhasil disimpan!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyimpan absensi."));
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleEndSession = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Selesaikan Sesi KBM?",
      message: "Pastikan absensi dan seluruh aktivitas telah selesai. Sesi yang diakhiri tidak dapat diubah kembali.",
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        try {
          const res = await endTentorSession(id);
          await fetchWorkspace();
          toast.success(res.data.message || "Sesi KBM berhasil diselesaikan.");
        } catch (error) {
          toast.error(getErrorMessage(error, "Gagal menyelesaikan sesi."));
          setActiveTab('attendance');
        }
      }
    });
  };

  const ACTIVITY_ACTIONS = {
    start:    { verb: 'memulai', done: 'Aktivitas dimulai.' },
    complete: { verb: 'menyelesaikan', done: 'Aktivitas diselesaikan.' },
    cancel:   { verb: 'membatalkan', done: 'Aktivitas dibatalkan.' },
    delete:   { verb: 'menghapus', done: 'Aktivitas dihapus.' },
  };

  const handleActivityAction = (activityId, action) => {
    setConfirmConfig({
      isOpen: true,
      title: "Konfirmasi Aktivitas",
      message: `Anda yakin ingin ${ACTIVITY_ACTIONS[action].verb} aktivitas ini?`,
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        try {
          if (action === 'delete') await deleteSessionActivity(id, activityId);
          else await changeSessionActivityStatus(id, activityId, action);
          await fetchWorkspace();
          toast.success(ACTIVITY_ACTIONS[action].done);
        } catch (error) {
          toast.error(getErrorMessage(error, "Gagal memperbarui aktivitas."));
        }
      }
    });
  };

  const handleMoveActivity = async (index, direction) => {
    const ordered = [...session.activities];
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    const previous = session.activities;
    setSession(prev => ({ ...prev, activities: ordered }));
    try {
      await reorderSessionActivities(id, ordered.map(act => act.id));
    } catch (error) {
      setSession(prev => ({ ...prev, activities: previous }));
      toast.error(getErrorMessage(error, "Gagal mengubah urutan aktivitas."));
    }
  };

  // Dipanggil ActivityManagerModal; error dilempar kembali agar modal tetap terbuka
  const handleAddNewActivity = async (newAct) => {
    await addSessionActivity(id, newAct);
    await fetchWorkspace();
    toast.success("Aktivitas berhasil ditambahkan.");
  };

//   / --- Perhitungan Ringkasan ---
  const totalStudents = session.students.length;
  const totalPresent = Object.values(attendanceData).filter(s => s === 'HADIR').length;
  const totalPermit = Object.values(attendanceData).filter(s => s === 'IZIN').length;
  const totalSick = Object.values(attendanceData).filter(s => s === 'SAKIT').length;
  const totalAbsent = Object.values(attendanceData).filter(s => s === 'ALPA').length;
  const totalUnfilled = totalStudents - totalPresent - totalPermit - totalSick - totalAbsent;
  const tentorLog = session.tentor_attendance;
  const totalActivities = session.activities.length;

  return (
    <div className="page-card space-y-6 pb-12 animate-in fade-in">
      <button onClick={() => navigate('/tentor/schedules')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} /> Kembali ke Jadwal
      </button>

      {/* HEADER WORKSPACE */}
      <div className={`bg-white rounded-2xl shadow-sm border-l-8 ${isSessionCompleted ? 'border-gray-400' : 'border-emerald-500'} p-6 flex justify-between items-center`}>
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">{session.subject_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded uppercase">{session.class_name} • Meeting {session.meeting_no}</span>
            <span className="text-sm font-bold text-gray-500">{session.formatted_date} • {session.start_time} - {session.end_time} WIB</span>
          </div>
        </div>
        <div>
          <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${isSessionCompleted ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {session.status === 'IN_PROGRESS' ? '● BERLANGSUNG' : session.status}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl shadow-sm px-6 pt-2 border border-gray-100 flex overflow-x-auto">
        {[{ id: 'overview', label: 'RINGKASAN' }, { id: 'activities', label: 'AKTIVITAS' }, { id: 'students', label: 'SISWA' }, { id: 'attendance', label: 'ABSENSI' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-xs font-black tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-400"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: ACTIVITIES */}
      {activeTab === 'activities' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Aktivitas Pembelajaran</h2>
              <p className="text-sm text-gray-500 mt-1">Daftar materi, diskusi, dan evaluasi untuk sesi ini.</p>
            </div>
            {!isSessionCompleted && (
              <button onClick={() => setIsActivityModalOpen(true)} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-black flex items-center gap-2">
                <Plus size={16} /> Tambah Aktivitas
              </button>
            )}
          </div>

          <div className="space-y-3">
            {session.activities.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl"><p className="text-sm font-bold text-gray-400">Belum ada aktivitas.</p></div>
            ) : (
              session.activities.map((act, index) => {
                const indexNum = String(index + 1).padStart(2, '0');
                const isReady = act.status === 'READY';
                const isInProgress = act.status === 'IN_PROGRESS';
                const isCompleted = act.status === 'COMPLETED';
                const isCancelled = act.status === 'CANCELLED';
                
                return (
                  <div key={act.id} className="group flex items-start md:items-center gap-4 p-4 border border-gray-200 bg-white rounded-2xl hover:border-indigo-300 transition-all shadow-sm">
                    {/* Urutan & Index */}
                    <div className="flex items-center gap-3">
                      {!isSessionCompleted && (
                        <div className="flex flex-col">
                          <button onClick={() => handleMoveActivity(index, -1)} disabled={index === 0} title="Naikkan" className="text-gray-300 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-300"><ChevronUp size={16}/></button>
                          <button onClick={() => handleMoveActivity(index, 1)} disabled={index === session.activities.length - 1} title="Turunkan" className="text-gray-300 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-300"><ChevronDown size={16}/></button>
                        </div>
                      )}
                      <div className="text-xl font-black text-gray-300 w-6">{indexNum}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 ml-2">
                      <div className="flex items-center gap-2 mb-1">
                        {getActivityIcon(act.type)}
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{getActivityTypeLabel(act.type)}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                          isCompleted ? 'text-gray-500' : isCancelled ? 'bg-rose-50 text-rose-500' : isInProgress ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {act.status}
                        </span>
                      </div>
                      <h3 className={`text-base font-bold leading-tight ${isCompleted || isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{act.title}</h3>
                      {act.reference_title && <p className="text-xs font-semibold text-indigo-600 mt-0.5">{act.type === 'EXAM' ? '📝' : '📚'} {act.reference_title}</p>}
                      {act.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{act.description}</p>}
                      {act.type === 'EXAM' && act.status !== 'READY' && (
                        <button onClick={() => navigate(`/tentor/evaluations?activity=${act.id}`)} className="text-xs font-bold text-rose-600 hover:underline mt-1">
                          {act.exam_submitted}/{totalStudents} siswa mengumpulkan{act.exam_pending > 0 ? ` • ${act.exam_pending} perlu dinilai` : ''} →
                        </button>
                      )}
                      <p className="text-xs font-bold text-gray-400 mt-1">{act.start_time || '--:--'} - {act.end_time || '--:--'} WIB</p>
                    </div>

                    {/* Actions */}
                    {!isSessionCompleted && (
                      <div className="shrink-0 flex items-center gap-2">
                        {isReady && canFillAttendance && <button onClick={() => handleActivityAction(act.id, 'start')} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg text-xs font-black transition-colors border border-indigo-100 hover:border-indigo-600">Mulai Aktivitas</button>}
                        {isInProgress && <button onClick={() => handleActivityAction(act.id, 'complete')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1"><CheckCircle2 size={14}/> Selesaikan</button>}
                        {(isReady || isInProgress) && <button onClick={() => handleActivityAction(act.id, 'cancel')} title="Batalkan" className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><XCircle size={16}/></button>}
                        {isReady && <button onClick={() => handleActivityAction(act.id, 'delete')} title="Hapus" className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">Ringkasan Sesi</h2>
            <p className="text-sm text-gray-500 mt-1">Kehadiran Anda dan rekap siswa pada sesi ini.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Check-in</p>
              <p className="text-lg font-black text-gray-900">{tentorLog?.checkin_time ? `${tentorLog.checkin_time} WIB` : '-'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Check-out</p>
              <p className="text-lg font-black text-gray-900">{tentorLog?.checkout_time ? `${tentorLog.checkout_time} WIB` : '-'}</p>
            </div>
            <div className={`p-4 rounded-xl border ${tentorLog?.late_minutes > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-gray-200'}`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Keterlambatan</p>
              <p className={`text-lg font-black ${tentorLog?.late_minutes > 0 ? 'text-rose-700' : 'text-gray-900'}`}>{tentorLog ? (tentorLog.late_minutes > 0 ? `${tentorLog.late_minutes} menit` : 'Tepat waktu') : '-'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Aktivitas</p>
              <p className="text-lg font-black text-gray-900">{totalActivities}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Siswa</p><p className="text-2xl font-black">{totalStudents}</p></div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center"><p className="text-xs font-bold text-emerald-600 uppercase">Hadir</p><p className="text-2xl font-black text-emerald-700">{totalPresent}</p></div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center"><p className="text-xs font-bold text-blue-600 uppercase">Izin</p><p className="text-2xl font-black text-blue-700">{totalPermit}</p></div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center"><p className="text-xs font-bold text-amber-600 uppercase">Sakit</p><p className="text-2xl font-black text-amber-700">{totalSick}</p></div>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center"><p className="text-xs font-bold text-rose-600 uppercase">Alpa</p><p className="text-2xl font-black text-rose-700">{totalAbsent}</p></div>
          </div>
        </div>
      )}

      {/* TAB: STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-6">Peserta Kelas ({totalStudents})</h2>
          {totalStudents === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl"><p className="text-sm font-bold text-gray-400">Belum ada siswa terdaftar di kelas ini.</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {session.students.map((student, index) => (
                <div key={student.id} className="py-3 flex items-center gap-4">
                  <div className="w-8 text-sm font-black text-gray-300">{String(index + 1).padStart(2, '0')}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{student.full_name}</p>
                    <p className="text-[11px] font-semibold text-gray-500">{student.school_name} • NIS {student.nis}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Absensi Siswa</h2>
              <p className="text-sm text-gray-500 mt-1">
                {canFillAttendance
                  ? `${totalUnfilled} siswa belum diabsen.`
                  : isSessionCompleted
                    ? 'Sesi telah selesai, absensi terkunci.'
                    : 'Mulai sesi terlebih dahulu untuk mengisi absensi.'}
              </p>
            </div>
            {canFillAttendance && totalStudents > 0 && (
              <button onClick={markAllPresent} className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-black flex items-center gap-2">
                <CheckCircle2 size={14}/> Tandai Semua Hadir
              </button>
            )}
          </div>

          {totalStudents === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl"><p className="text-sm font-bold text-gray-400">Belum ada siswa terdaftar di kelas ini.</p></div>
          ) : (
            <div className="space-y-3">
              {session.students.map(student => {
                const status = attendanceData[student.id] || 'BELUM';
                return (
                  <div key={student.id} className="p-4 border border-gray-200 rounded-2xl flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{student.full_name}</p>
                      <p className="text-[11px] font-semibold text-gray-500">{student.school_name} • NIS {student.nis}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { value: 'HADIR', active: 'bg-emerald-600 text-white border-emerald-600' },
                        { value: 'IZIN', active: 'bg-blue-600 text-white border-blue-600' },
                        { value: 'SAKIT', active: 'bg-amber-500 text-white border-amber-500' },
                        { value: 'ALPA', active: 'bg-rose-600 text-white border-rose-600' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          disabled={!canFillAttendance}
                          onClick={() => handleAttendanceChange(student.id, opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-colors disabled:cursor-not-allowed ${status === opt.value ? opt.active : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                    {status !== 'HADIR' && status !== 'BELUM' && (
                      <input
                        type="text"
                        disabled={!canFillAttendance}
                        value={attendanceNotes[student.id] || ''}
                        onChange={e => setAttendanceNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                        placeholder="Keterangan..."
                        className="md:w-48 border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-indigo-500 disabled:bg-gray-50"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canFillAttendance && totalStudents > 0 && (
            <div className="flex justify-end mt-6">
              <button onClick={handleSaveAttendance} disabled={savingAttendance} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50">
                <ClipboardCheck size={16}/> {savingAttendance ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ACTION */}
      {session.status === 'IN_PROGRESS' && (
        <div className="flex justify-end pt-4">
          <button onClick={handleEndSession} className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-black shadow-lg">
            Selesaikan Sesi KBM
          </button>
        </div>
      )}

      {/* Extracted Components */}
      <ActivityManagerModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)} 
        onSave={handleAddNewActivity}
        sessionInfo={session} 
      />

      <Toast show={toastState.show} message={toastState.message} type={toastState.type} onClose={hideToast} />

      <ConfirmationModal 
        open={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ isOpen: false })}
      />
    </div>
  );
}