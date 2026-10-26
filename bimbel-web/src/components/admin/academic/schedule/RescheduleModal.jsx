import React, { useState, useEffect } from "react";
import { X, CalendarClock, AlertTriangle, ArrowRight, ArrowLeft, Check, CalendarDays, Clock, User, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/useToast";

// 🟢 Import fungsi dari Service Frontend (Tidak ada API Hardcode)
import { validateRescheduleSession, rescheduleSession } from "@/services/academic/scheduleService";
import { getTentors } from "@/services/admin/tentorService"; // Sesuaikan path ini
import { getLocations } from "@/services/admin/locationService"; // Sesuaikan path ini

export default function RescheduleModal({ open, session, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  
  // Master data state
  const [tentors, setTentors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [conflictError, setConflictError] = useState(null);

  // Form state untuk jadwal baru
  const [formData, setFormData] = useState({
    session_date: "",
    start_time: "",
    end_time: "",
    tentor_id: "",
    location_id: "",
    room_name: "",
    meeting_url: "",
    reason: "",
    note: ""
  });

  useEffect(() => {
    if (open && session) {
      setStep(1);
      setConflictError(null);
      
      // 🟢 PENCEGAHAN ERROR "tentor_id required":
      // Ambil ID dari root (session.tentor_id) atau relasi (session.tentor.id)
      const safeTentorId = session.tentor_id || session.tentor?.id || "";
      const safeLocationId = session.location_id || session.location?.id || "";

      setFormData({
        session_date: session.session_date || "",
        start_time: session.start_time?.substring(0, 5) || "",
        end_time: session.end_time?.substring(0, 5) || "",
        tentor_id: safeTentorId,
        location_id: safeLocationId,
        room_name: session.room_name || "",
        meeting_url: session.meeting_url || "",
        reason: "",
        note: ""
      });
      fetchMasterData();
    }
  }, [open, session]);

  const fetchMasterData = async () => {
    try {
      // 🟢 Panggil data Master melalui Service Frontend
      const [resTentors, resLocations] = await Promise.all([
        getTentors({ perPage: 100 }).catch(() => ({ data: { data: [] } })),
        getLocations({ perPage: 100 }).catch(() => ({ data: { data: [] } }))
      ]);
      
      setTentors(resTentors.data?.data || resTentors.data || []);
      setLocations(resLocations.data?.data || resLocations.data || []);
    } catch (error) {
      console.error("Gagal memuat data referensi:", error);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.reason) {
        showError("Silakan pilih alasan reschedule terlebih dahulu.");
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      // 🟢 Pastikan tentor_id tidak kosong sebelum tembak API
      const finalTentorId = formData.tentor_id || session.tentor_id;
      if (!finalTentorId) {
          showError("Mohon pilih tentor pengampu.");
          return;
      }
      // 🟢 LOGIKA VALIDASI SEKARANG DITANGANI BACKEND (Seperti Schedule Wizard)
      try {
        setLoading(true);
        setConflictError(null);
        
        // Buat payload khusus untuk validasi
        const payload = {
           schedule_session_id: session.id,
           session_date: formData.session_date,
           start_time: formData.start_time,
           end_time: formData.end_time,
           tentor_id: formData.tentor_id || session.tentor_id // Jaga-jaga agar tidak kosong
        };
        
        // Panggil endpoint validasi dari Service
        await validateRescheduleSession(payload);
        
        // Jika lolos (tidak ada exception 422 dari backend)
        setConflictError(null);
        setStep(3); // Lanjut ke step konfirmasi
      } catch (error) {
        // Tangkap pesan error bentrok dari response backend
        const errorMessage = error.response?.data?.message || "Terjadi bentrok jadwal dengan sesi lain.";
        setConflictError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    setStep((s) => Math.max(1, s - 1));
    setConflictError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // 🟢 Panggil endpoint eksekusi update session dari Service
      await rescheduleSession(session.id, formData);
      
      showSuccess("Sesi berhasil di-reschedule.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Gagal melakukan reschedule sesi.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !session) return null;

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "EEEE, dd MMMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  // Mencari nama tentor baru berdasarkan pilihan
  const getSelectedTentorName = () => {
    const selected = tentors.find(t => t.id === formData.tentor_id);
    return selected ? (selected.user?.name || selected.name || selected.full_name) : session.tentor_name;
  };

  const REASONS = [
    "Tentor berhalangan",
    "Permintaan siswa/kelas",
    "Ruangan tidak tersedia",
    "Bentrok jadwal",
    "Perubahan operasional",
    "Lainnya"
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Reschedule Session</h3>
              <p className="text-xs font-medium text-gray-500">Ubah jadwal sesi tanpa mengubah master schedule kelas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* PROGRESS TABS */}
        <div className="flex bg-slate-50 border-b border-gray-100 shrink-0">
          {[
            { id: 1, label: "Jadwal Saat Ini" },
            { id: 2, label: "Jadwal Baru" },
            { id: 3, label: "Konfirmasi" }
          ].map((s) => (
            <div 
              key={s.id}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-colors ${
                step === s.id 
                  ? "border-amber-500 text-amber-700 bg-amber-50/30" 
                  : step > s.id 
                    ? "border-emerald-500 text-emerald-600" 
                    : "border-transparent text-gray-400"
              }`}
            >
              Step {s.id}: {s.label}
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: CURRENT INFO & REASON */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Jadwal Saat Ini</h4>
                <div className="mb-4">
                  <h3 className="text-lg font-black text-gray-900">{session.subject_name}</h3>
                  <p className="text-sm font-bold text-blue-600">{session.class_name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal</p>
                      <p className="text-sm font-semibold text-slate-700">{formatDateDisplay(session.session_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu</p>
                      <p className="text-sm font-semibold text-slate-700">{session.start_time} - {session.end_time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <User size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tentor</p>
                      <p className="text-sm font-semibold text-slate-700">{session.tentor_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Lokasi</p>
                      <p className="text-sm font-semibold text-slate-700">{session.room_name || "Online"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Alasan Reschedule <span className="text-red-500">*</span></label>
                <select 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="">-- Pilih Alasan --</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[80px]"
                  placeholder="Penjelasan detail jika diperlukan..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: NEW SCHEDULE */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              
              {conflictError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in zoom-in-95">
                  <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800">BENTROK JADWAL TERDETEKSI</h4>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">{conflictError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Tanggal Baru</label>
                <input 
                  type="date" 
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Jam Mulai</label>
                  <input 
                    type="time" 
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Jam Selesai</label>
                  <input 
                    type="time" 
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Tentor (Opsional: Ubah jika digantikan)</label>
                <select 
                  value={formData.tentor_id}
                  onChange={(e) => setFormData({...formData, tentor_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  {/* Pilihan Default (Tentor Saat Ini) */}
                  <option value={session.tentor_id || ""}>
                    {session.tentor_name || "...Pilih Tentor..."} (Saat Ini)
                  </option>
                  {/* Map dari state tentors (Menangani kemungkinan format JSON dari backend) */}
                  {tentors.map(t => (
                    t.id !== session.tentor_id && (
                      <option key={t.id} value={t.id}>
                        {t.user?.name || t.name || t.full_name || "Tentor Tanpa Nama"}
                      </option>
                    )
                  ))}
                </select>
              </div>

              {session.class_type === "ONLINE" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Meeting URL</label>
                  <input 
                    type="url" 
                    value={formData.meeting_url}
                    onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Lokasi / Ruangan</label>
                  <input 
                    type="text" 
                    value={formData.room_name}
                    onChange={(e) => setFormData({...formData, room_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              )}

            </div>
          )}

          {/* STEP 3: CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-5 animate-in slide-in-from-right-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                <Check size={18} className="text-emerald-600" />
                <h4 className="text-xs font-bold text-emerald-800">Pengecekan Konflik Berhasil. Jadwal tersedia.</h4>
              </div>

              {/* Tampilan Konfirmasi Mendetail Before-After */}
              <div className="relative pt-2">
                <div className="absolute left-6 top-6 bottom-4 w-0.5 bg-gray-200"></div>
                
                <div className="relative pl-14 pb-5">
                  <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Jadwal Lama</h4>
                  <p className="text-sm font-semibold text-slate-700">{formatDateDisplay(session.session_date)}</p>
                  <p className="text-xs font-medium text-slate-500">{session.start_time} - {session.end_time}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    <User size={10} className="inline mr-1"/>{session.tentor_name}
                    <span className="mx-2 text-slate-300">|</span>
                    <MapPin size={10} className="inline mr-1"/>{session.room_name || 'Gedung Pusat'}
                  </p>
                </div>

                <div className="relative pl-14">
                  <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm"></div>
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Jadwal Baru</h4>
                  <p className="text-sm font-black text-amber-700">{formatDateDisplay(formData.session_date)}</p>
                  <p className="text-xs font-bold text-amber-600">{formData.start_time} - {formData.end_time}</p>
                  <p className="text-xs font-bold text-amber-700 mt-1">
                    <User size={10} className="inline mr-1"/>{getSelectedTentorName()} 
                    <span className="mx-2 text-amber-300">|</span>
                    <MapPin size={10} className="inline mr-1"/>{formData.room_name || 'Gedung Pusat'}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs">
                <div className="grid grid-cols-[80px_1fr] gap-1">
                  <span className="font-bold text-slate-500">Alasan:</span>
                  <span className="font-semibold text-slate-800">{formData.reason}</span>
                  {formData.note && <><span className="font-bold text-slate-500">Catatan:</span><span className="font-semibold text-slate-800 italic">"{formData.note}"</span></>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-gray-100 flex justify-between bg-slate-50 shrink-0">
          <button 
            onClick={step > 1 ? handlePrev : onClose} 
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
          >
            {step > 1 ? <><ArrowLeft size={14} /> Kembali</> : "Batal"}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-sm shadow-amber-500/20"
            >
              {loading ? "Memeriksa..." : <>Lanjut <ArrowRight size={14} /></>}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20"
            >
              <Check size={14} /> {loading ? "Menyimpan..." : "Konfirmasi & Simpan"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}