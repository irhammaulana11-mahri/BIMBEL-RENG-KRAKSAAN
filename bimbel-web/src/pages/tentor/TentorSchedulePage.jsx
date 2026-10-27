import React, { useState, useEffect, useCallback } from "react";
import { Search, Clock, PlayCircle, Eye, ArrowRightCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTentorSchedules, startTentorSession, requestReschedule, getTentorRescheduleRequests, cancelTentorRescheduleRequest } from "@/services/tentor/scheduleService";
import { APP_ROUTES } from "../../components/constants/routes"; 
import SessionDetailDrawer from "../../components/tentor/SessionDetailDrawer"; // Komponen terpisah
import ConfirmationModal from "../../components/ui/confirmation/ConfirmationModal";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { REQUEST_STATUS, formatSessionDate, dateOffset } from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { currentPeriod } from "@/utils/format";

export default function TentorSchedulePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [confirm, setConfirm] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [filters, setFilters] = useState({
    filter_mode: "hari_ini",
    month: currentPeriod(), // YYYY-MM (waktu lokal)
    keyword: "",
    status: "",
    class_type: ""
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTentorSchedules(filters);
      setSchedules(res.data?.data || []);
    } catch (error) {
      console.error("Gagal memuat jadwal:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSchedules(), 300);
    return () => clearTimeout(timer);
  }, [fetchSchedules]);

  const fetchRequests = () => getTentorRescheduleRequests()
    .then((res) => setRequests(res.data.data || []))
    .catch(() => {});

  useEffect(() => { fetchRequests(); }, []);

  // --- ACTIONS ---
  const handleStartSession = (sessionId) => setConfirm({
    open: true,
    title: "Mulai Sesi?",
    message: "Sesi KBM akan dimulai sekarang dan check-in Anda tercatat.",
    variant: "primary",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        await startTentorSession(sessionId);
        setSelectedSession(null);
        navigate(APP_ROUTES.TENTOR.WORKSPACE(sessionId));
      } catch (error) {
        showError(getApiErrorMessage(error, "Gagal memulai sesi."));
      }
    },
  });

  const handleContinueSession = (sessionId) => {
    setSelectedSession(null);
    navigate(APP_ROUTES.TENTOR.WORKSPACE(sessionId));
  };

  // Dipanggil RescheduleModal; error dilempar kembali agar tampil di modal
  const submitReschedule = async (formData) => {
    const res = await requestReschedule(selectedSession.id, formData);
    showSuccess(res.data.message);
    setIsRescheduleOpen(false);
    setSelectedSession(null);
    fetchSchedules();
    fetchRequests();
  };

  const handleCancelRequest = (req) => setConfirm({
    open: true,
    title: "Batalkan Pengajuan?",
    message: `Pengajuan reschedule ${req.session?.subject_name} (${formatSessionDate(req.original_date)}) akan dibatalkan.`,
    variant: "warning",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        const res = await cancelTentorRescheduleRequest(req.id);
        showSuccess(res.data.message);
        fetchRequests();
      } catch (error) {
        showError(getApiErrorMessage(error, "Gagal membatalkan pengajuan."));
      }
    },
  });

  // --- UI Helpers (Badge & Button) ---
  const getStatusBadge = (status) => {
    switch(status) {
      case "SCHEDULED": 
      case "RESCHEDULED": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">DIJADWALKAN</span>;
      case "PREPARING": return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">PERSIAPAN</span>;
      case "IN_PROGRESS": return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">BERLANGSUNG</span>;
      case "COMPLETED": return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">SELESAI</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const getCardCTAButton = (item) => {
    if (['SCHEDULED', 'RESCHEDULED', 'PREPARING'].includes(item.status)) {
      return (
        <button onClick={() => setSelectedSession(item)} className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm flex justify-center items-center gap-2">
          <PlayCircle size={16} /> Buka Sesi
        </button>
      );
    } else if (item.status === 'IN_PROGRESS') {
      return (
        <button onClick={() => setSelectedSession(item)} className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex justify-center items-center gap-2">
          <ArrowRightCircle size={16} /> Lanjutkan Sesi
        </button>
      );
    }
    return (
      <button onClick={() => setSelectedSession(item)} className="w-full md:w-auto px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-black flex justify-center items-center gap-2">
        <Eye size={16} /> Detail Sesi
      </button>
    );
  };

  const groupedSchedules = schedules.reduce((acc, curr) => {
    if (!acc[curr.formatted_date]) acc[curr.formatted_date] = [];
    acc[curr.formatted_date].push(curr);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6 md:p-8">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Jadwal Mengajar</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar sesi mengajar yang telah dijadwalkan untuk Anda.</p>
        </div>

        {/* 🟢 TOOLBAR: TABS & FILTERS */}
        <div className="bg-slate-50 border border-gray-200 p-2 md:p-3 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          
          <div className="flex bg-gray-200/80 p-1 rounded-xl border border-gray-200 w-full lg:w-auto">
            <button onClick={() => setFilters({...filters, filter_mode: "hari_ini"})} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "hari_ini" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>Hari Ini</button>
            <button onClick={() => setFilters({...filters, filter_mode: "minggu_ini"})} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "minggu_ini" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>Minggu Ini</button>
            {/* 🟢 TAB BULANAN */}
            <button onClick={() => setFilters({...filters, filter_mode: "bulanan"})} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filters.filter_mode === "bulanan" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>Bulanan</button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* 🟢 INPUT MONTH (Hanya muncul saat mode bulanan) */}
            {filters.filter_mode === 'bulanan' && (
               <div className="relative w-full md:w-auto">
                 <input 
                   type="month" 
                   value={filters.month} 
                   onChange={(e) => setFilters({...filters, month: e.target.value})} 
                   className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500 shadow-sm"
                 />
               </div>
            )}
            
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari kelas, mapel..." value={filters.keyword} onChange={(e) => setFilters({...filters, keyword: e.target.value})} className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-gray-300 rounded-xl outline-none focus:border-indigo-500 shadow-sm" />
            </div>
          </div>
        </div>

        {/* 🟢 LIST JADWAL */}
        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-gray-400 border border-gray-200 rounded-2xl bg-white animate-pulse">Memuat jadwal...</div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-slate-50">Tidak ada sesi mengajar.</div>
        ) : (
          <div className="space-y-6">
            {filters.filter_mode === 'hari_ini' ? (
              <div className="space-y-4">
                {schedules.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-center min-w-[95px]">
                        <Clock size={16} className="mx-auto mb-1 opacity-70"/>
                        <p className="text-sm font-black">{item.start_time}</p>
                      </div>
                      <div>
                        <div className="flex gap-2 mb-1.5 flex-wrap">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase bg-slate-50 text-slate-600 border-slate-200">{item.class_type}</span>
                          {getStatusBadge(item.status)}
                        </div>
                        <h3 className="text-base font-black text-gray-900 leading-tight">{item.subject_name}</h3>
                        <p className="text-sm font-bold text-indigo-600 mt-1">{item.class_name}</p>
                      </div>
                    </div>
                    {getCardCTAButton(item)}
                  </div>
                ))}
              </div>
            ) : (
              // Tampilan untuk 'minggu_ini' dan 'bulanan' di-grouping per tanggal
              Object.keys(groupedSchedules).map(date => (
                <div key={date}>
                  <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-3 mt-6 first:mt-0">{date}</h2>
                  <div className="space-y-4">
                    {groupedSchedules[date].map(item => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-colors shadow-sm">
                         <div className="flex gap-4">
                           <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-center min-w-[95px]">
                             <Clock size={16} className="mx-auto mb-1 opacity-70"/>
                             <p className="text-sm font-black">{item.start_time}</p>
                           </div>
                           <div>
                             <div className="flex gap-2 mb-1.5 flex-wrap">
                               <span className="text-[9px] font-black px-2 py-0.5 rounded border uppercase bg-slate-50 text-slate-600 border-slate-200">{item.class_type}</span>
                               {getStatusBadge(item.status)}
                             </div>
                             <h3 className="text-base font-black text-gray-900 leading-tight">{item.subject_name}</h3>
                             <p className="text-sm font-bold text-indigo-600 mt-1">{item.class_name}</p>
                           </div>
                         </div>
                         {getCardCTAButton(item)}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="px-6 md:px-8 pb-8 -mt-2">
        <RescheduleRequestList requests={requests} onCancel={handleCancelRequest} />
      </div>

      {/* Komponen Eksternal */}
      <SessionDetailDrawer 
        isOpen={!!selectedSession} 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)}
        onStartSession={handleStartSession}
        onContinueSession={handleContinueSession}
        onOpenReschedule={() => setIsRescheduleOpen(true)}
      />
      <RescheduleModal open={isRescheduleOpen} session={selectedSession} onClose={() => setIsRescheduleOpen(false)} onSubmit={submitReschedule} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}

function RescheduleModal({ open, session, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ proposed_date: "", proposed_time: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({ proposed_date: "", proposed_time: session?.start_time?.slice(0, 5) || "", reason: "" });
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim pengajuan reschedule."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-black text-gray-900 text-sm">Ajukan Reschedule</h3>
            {session && <p className="text-[11px] text-gray-500">{session.subject_name} • {session.class_name} • {session.start_time}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Usulan Tanggal Baru</label>
            <input type="date" required min={dateOffset(0)} value={formData.proposed_date} onChange={e => setFormData({...formData, proposed_date: e.target.value})} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Usulan Jam Mulai</label>
            <input type="time" required value={formData.proposed_time} onChange={e => setFormData({...formData, proposed_time: e.target.value})} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500" />
            <p className="text-[10px] text-gray-400 mt-1">Durasi mengikuti sesi semula.</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Alasan</label>
            <textarea required minLength={5} maxLength={255} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows="3" placeholder="Sebutkan alasan..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 resize-none"></textarea>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-black shadow-sm">{saving ? "Mengirim..." : "Kirim Pengajuan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RescheduleRequestList({ requests, onCancel }) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900 text-sm">Pengajuan Reschedule Saya</div>
      <div className="divide-y divide-gray-100">
        {requests.map((r) => (
          <div key={r.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-bold text-gray-900">{r.session?.subject_name} • {r.session?.class_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatSessionDate(r.original_date, { day: "numeric", month: "short" })} {r.original_start_time} → <b className="text-gray-800">{formatSessionDate(r.proposed_date, { weekday: "short", day: "numeric", month: "short" })} {r.proposed_start_time}-{r.proposed_end_time}</b>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Alasan: {r.reason}</p>
              {r.review_note && <p className={`text-xs mt-0.5 ${r.status === "REJECTED" ? "text-rose-600" : "text-emerald-700"}`}>Catatan Admin: {r.review_note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
              {r.status === "PENDING" && <button onClick={() => onCancel(r)} className="text-xs font-bold text-gray-500 hover:text-rose-600">Batalkan</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}