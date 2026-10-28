import React, { useState, useEffect } from "react";
import { X, Check, FileText, CheckCircle2 } from "lucide-react";
import { getStudentAttendanceForm, saveStudentAttendance } from "@/services/academic/attendanceService";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";

export default function StudentAttendanceModal({ open, sessionId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [students, setStudents] = useState([]);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (open && sessionId) fetchForm();
  }, [open, sessionId]);

  const fetchForm = async () => {
    setLoading(true);
    try {
      const res = await getStudentAttendanceForm(sessionId);
      setSessionData(res.data.session);
      setStudents(res.data.students);
    } catch (error) {
      showError("Gagal memuat form absensi");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudents(prev => prev.map(s => 
      s.student_id === studentId ? { ...s, attendance_status: status, note: status === 'HADIR' ? '' : s.note } : s
    ));
  };

  const handleNoteChange = (studentId, note) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, note } : s));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, attendance_status: 'HADIR', note: '' })));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        attendances: students.map(({ student_id, attendance_status, note }) => ({ student_id, attendance_status, note })),
      };
      await saveStudentAttendance(sessionId, payload);
      showSuccess("Absensi berhasil disimpan!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Gagal menyimpan absensi.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Penghitungan Summary
  const summary = {
    total: students.length,
    hadir: students.filter(s => s.attendance_status === 'HADIR').length,
    izin: students.filter(s => s.attendance_status === 'IZIN').length,
    sakit: students.filter(s => s.attendance_status === 'SAKIT').length,
    alpa: students.filter(s => s.attendance_status === 'ALPA').length,
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in" onClick={onClose}>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:w-[640px] h-full shadow-2xl overflow-hidden flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-slate-50 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900">{sessionData?.subject_name}</h2>
            <p className="text-sm font-bold text-blue-600">{sessionData?.class_name}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              {sessionData?.session_date} • {sessionData?.start_time} - {sessionData?.end_time} WIB | Tentor: {sessionData?.tentor_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-xl"><X size={20} /></button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="p-6 pb-2 shrink-0 grid grid-cols-5 gap-3">
           <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Terdaftar</p><p className="text-2xl font-black">{summary.total}</p></div>
           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center"><p className="text-xs font-bold text-emerald-600 uppercase">Hadir</p><p className="text-2xl font-black text-emerald-700">{summary.hadir}</p></div>
           <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center"><p className="text-xs font-bold text-blue-600 uppercase">Izin</p><p className="text-2xl font-black text-blue-700">{summary.izin}</p></div>
           <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center"><p className="text-xs font-bold text-amber-600 uppercase">Sakit</p><p className="text-2xl font-black text-amber-700">{summary.sakit}</p></div>
           <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center"><p className="text-xs font-bold text-rose-600 uppercase">Alpa</p><p className="text-2xl font-black text-rose-700">{summary.alpa}</p></div>
        </div>

        {/* STUDENTS TABLE */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800">Daftar Siswa</h3>
             <button onClick={markAllPresent} className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
               <CheckCircle2 size={14}/> Tandai Semua Hadir
             </button>
          </div>

          {loading ? (
             <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Memuat data siswa...</div>
          ) : (
            <table className="ui-table w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                  <th className="pb-3 w-1/3">Nama Siswa</th>
                  <th className="pb-3 w-1/4">Kehadiran</th>
                  <th className="pb-3">Catatan (Opsional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td className="py-3">
                      <p className="text-sm font-bold text-gray-900">{student.student_name}</p>
                      <p className="text-[11px] font-mono text-gray-700">{student.school_name} - {student.nis}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <select 
                        value={student.attendance_status}
                        onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                        className={`w-full border rounded-xl p-2 text-xs font-bold outline-none cursor-pointer ${
                          student.attendance_status === 'HADIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          student.attendance_status === 'IZIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          student.attendance_status === 'SAKIT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          student.attendance_status === 'ALPA' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        <option value="BELUM">⚪ BELUM DIISI</option>
                        <option value="HADIR">🟢 HADIR</option>
                        <option value="IZIN">🔵 IZIN</option>
                        <option value="SAKIT">🟡 SAKIT</option>
                        <option value="ALPA">🔴 ALPA</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <input 
                        type="text" 
                        placeholder={student.attendance_status === 'HADIR' ? "Hadir tidak perlu catatan" : "Sakit/Izin orang tua..."}
                        disabled={student.attendance_status === 'HADIR'}
                        value={student.note || ''}
                        onChange={(e) => handleNoteChange(student.student_id, e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm disabled:opacity-50">
            <Check size={16} /> {saving ? "Menyimpan..." : "Simpan Absensi"}
          </button>
        </div>

      </div>
    </div>
  );
}