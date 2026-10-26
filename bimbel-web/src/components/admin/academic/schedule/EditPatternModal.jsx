import React, { useState, useEffect } from "react";
import { X, Check, Clock, CalendarDays, RefreshCw } from "lucide-react";
import { updateSchedulePattern } from "@/services/academic/scheduleService";
import { useToast } from "@/hooks/useToast";
import { getTentors } from "@/services/admin/tentorService"; 
import { DAY_MAP } from "../../../constants/schedule.constants";

export default function EditPatternModal({ open, schedule, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [tentors, setTentors] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    day_of_week: "", start_time: "", end_time: "", tentor_id: "",
    location_id: "", room_name: "", meeting_url: "",
    apply_method: "uncompleted", apply_date: ""
  });

  useEffect(() => {
    if (open && schedule) {
      setFormData({
        day_of_week: schedule.day_of_week, start_time: schedule.start_time, end_time: schedule.end_time,
        tentor_id: schedule.tentor_id, location_id: schedule.location_id || "", room_name: schedule.room_name || "",
        meeting_url: schedule.meeting_url || "", apply_method: "uncompleted", apply_date: ""
      });
      getTentors({ perPage: 100 }).then(res => setTentors(res.data?.data || res.data || []));
    }
  }, [open, schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateSchedulePattern(schedule.id, formData);
      showSuccess("Pola Jadwal berhasil diperbarui.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Gagal memperbarui pola.";
      setConflictError(errorMessage);
      showError("Gagal memperbarui pola karena bentrok jadwal.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !schedule) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><RefreshCw size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Edit Pola Master</h3>
              <p className="text-xs font-medium text-gray-500">{schedule.subject_name} • {schedule.class_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 🟢 Tampilkan Kotak Peringatan Bentrok Jika Ada */}
          {conflictError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in zoom-in-95">
              <div className="text-red-600 mt-0.5 shrink-0 font-bold">⚠️</div>
              <div>
                <h4 className="text-xs font-black text-red-800 uppercase">BENTROK JADWAL TERDETEKSI</h4>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{conflictError}</p>
              </div>
            </div>
          )}
          {/* BAGIAN 1: EDIT POLA JADWAL */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-800 border-b pb-2 flex items-center gap-2"><Clock size={16}/> Pengaturan Pola Rutin</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hari</label>
                <select value={formData.day_of_week} onChange={(e) => setFormData({...formData, day_of_week: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none">
                  <option value="">-- Pilih Hari --</option>
                  {Object.entries(DAY_MAP).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mulai</label>
                <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selesai</label>
                <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tentor Pengampu</label>
                <select 
                  value={formData.tentor_id} 
                  onChange={(e) => setFormData({...formData, tentor_id: e.target.value})} 
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none"
                >
                  <option value={schedule.tentor_id || ""}>
                    {schedule.tentor_name || "Pilih Tentor"} (Saat Ini)
                  </option>
                  {tentors.map(t => (
                    t.id !== schedule.tentor_id && (
                      <option key={t.id} value={t.id}>
                        {t.user?.name || t.name || t.full_name || "Tentor Tanpa Nama"}
                      </option>
                    )
                  ))}
                </select>
              </div>
              {schedule.class_type === "ONLINE" ? (
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Meeting URL</label><input type="url" value={formData.meeting_url} onChange={(e) => setFormData({...formData, meeting_url: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none"/></div>
              ) : (
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Ruangan</label><input type="text" value={formData.room_name} onChange={(e) => setFormData({...formData, room_name: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none"/></div>
              )}
            </div>
            
          </div>

          {/* BAGIAN 2: LOGIKA PENERAPAN (SYNC TO SESSION) */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-800 border-b pb-2 flex items-center gap-2"><CalendarDays size={16}/> Bagaimana perubahan ini diterapkan?</h4>
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="apply" value="none" checked={formData.apply_method === "none"} onChange={(e) => setFormData({...formData, apply_method: e.target.value})} className="mt-1 accent-amber-600"/>
                <div>
                  <p className="text-xs font-bold text-gray-900">Hanya untuk jadwal yang akan di-generate (Masa Depan)</p>
                  <p className="text-[11px] text-gray-500">Session KBM yang sudah terbuat di sistem tidak akan berubah.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="apply" value="uncompleted" checked={formData.apply_method === "uncompleted"} onChange={(e) => setFormData({...formData, apply_method: e.target.value})} className="mt-1 accent-amber-600"/>
                <div>
                  <p className="text-xs font-bold text-gray-900">Terapkan ke seluruh Session yang belum terlaksana</p>
                  <p className="text-[11px] text-gray-500">Session yang sudah selesai (COMPLETED) tidak akan berubah posisinya.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="apply" value="date" checked={formData.apply_method === "date"} onChange={(e) => setFormData({...formData, apply_method: e.target.value})} className="mt-1 accent-amber-600"/>
                <div className="w-full">
                  <p className="text-xs font-bold text-gray-900">Terapkan mulai tanggal tertentu</p>
                  {formData.apply_method === "date" && (
                    <input type="date" required value={formData.apply_date} onChange={(e) => setFormData({...formData, apply_date: e.target.value})} className="mt-2 border border-gray-300 rounded-lg p-2 text-xs outline-none w-1/2"/>
                  )}
                </div>
              </label>

            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
              <Check size={14} /> {loading ? "Menyimpan..." : "Simpan Pola"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}