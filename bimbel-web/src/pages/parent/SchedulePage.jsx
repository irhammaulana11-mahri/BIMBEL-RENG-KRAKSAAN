import React, { useEffect, useState } from "react";
import { Calendar, Clock, User, ArrowRightLeft, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

// ================= DATA DUMMY SIMULASI JADWAL =================
const DUMMY_SCHEDULES = [
  {
    id: "SCH-001",
    date: "2026-07-21",
    start_time: "15:30",
    end_time: "17:00",
    subject: { name: "Matematika IPA" },
    tentor: { name: "Kak Dimas Prasetyo, S.Si." },
    student: { student_name: "Agus Santoso" },
    room: "Ruang A-02"
  },
  {
    id: "SCH-002",
    date: "2026-07-22",
    start_time: "18:30",
    end_time: "20:00",
    subject: { name: "Bahasa Inggris" },
    tentor: { name: "Miss Sarah Amalia, M.Pd." },
    student: { student_name: "Siti Rahma" },
    room: "Ruang B-01"
  },
  {
    id: "SCH-003",
    date: "2026-07-24",
    start_time: "16:00",
    end_time: "17:30",
    subject: { name: "Fisika Dasar" },
    tentor: { name: "Pak Hendra K., M.T." },
    student: { student_name: "Agus Santoso" },
    room: "Lab Sains 1"
  }
];

export default function ParentSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({ request_date: "", request_time: "", reason: "" });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/parent/schedules");
      const data = res.data?.data || res.data;
      // Gunakan data dari API jika ada dan tidak kosong, jika kosong gunakan data dummy
      if (Array.isArray(data) && data.length > 0) {
        setSchedules(data);
      } else {
        setSchedules(DUMMY_SCHEDULES);
      }
    } catch (err) {
      console.warn("API /parent/schedules tidak terhubung. Menggunakan data dummy lokal.");
      // Fallback ke data dummy ketika terjadi error API
      setSchedules(DUMMY_SCHEDULES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchedules(); }, []);

  const handleOpenReschedule = (schedule) => {
    setSelectedSchedule(schedule);
    setOpenModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      hideToast();
      
      // Kirim permohonan ke API jika terhubung
      await api.post(`/parent/schedules/${selectedSchedule.id}/reschedule`, formData);
      showSuccess("Permohonan reschedule berhasil dikirim! Menunggu konfirmasi admin.");
    } catch (err) {
      // Jika API belum tersedia, tetap berikan respons sukses sebagai simulasi UI
      showSuccess("Simulasi Reschedule: Permohonan berhasil diajukan!");
    } finally {
      setOpenModal(false);
      setFormData({ request_date: "", request_time: "", reason: "" });
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      <Toast {...toast} onClose={hideToast} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Jadwal Belajar</h1>
            <p className="text-base text-gray-500 mt-1">Pantau agenda kelas bimbingan aktif beserta riwayat pengajuan pemindahan jadwal kelas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading && schedules.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-400 font-medium">
              Memuat jadwal belajar...
            </div>
          )}

          {!loading && schedules.length === 0 && (
            <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 italic font-medium">
              Tidak ada jadwal kelas aktif minggu ini.
            </div>
          )}

          {schedules.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wide">
                    {item.subject?.name || item.subject_name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono font-bold">
                    Tentor: {item.tentor?.name || "-"}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-gray-950 tracking-tight flex items-center gap-2">
                  <User size={18} className="text-slate-400" /> {item.student?.student_name}
                </h3>

                <div className="space-y-2 text-sm font-semibold text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{new Date(item.date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-mono">{item.start_time} - {item.end_time} WIB</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenReschedule(item)}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200/50 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                <ArrowRightLeft size={14} /> Ajukan Reschedule Sementara
              </button>
            </div>
          ))}
        </div>

        {/* Modal Reschedule */}
        {openModal && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h3 className="text-lg font-black text-gray-950 tracking-tight">Form Perubahan Jadwal</h3>
                <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl flex items-start gap-2 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Pengajuan bersifat ajuan sementara untuk sesi ini saja dan memerlukan persetujuan admin operasional.</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Tanggal Pengganti Baru</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-semibold focus:outline-none focus:border-blue-500" value={formData.request_date} onChange={(e) => setFormData({...formData, request_date: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Jam Pengganti</label>
                  <input type="time" className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500" value={formData.request_time} onChange={(e) => setFormData({...formData, request_time: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Alasan Pemindahan</label>
                  <textarea className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-medium min-h-[70px] focus:outline-none focus:border-blue-500" placeholder="Contoh: Anak ada ujian mendadak di sekolah..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpenModal(false)} className="flex-1 py-2.5 border border-gray-200 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl shadow-xs transition-all">
                    {loading ? "Mengirim..." : "Kirim Ajuan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}