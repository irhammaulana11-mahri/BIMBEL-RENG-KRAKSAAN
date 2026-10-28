import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, User, ArrowRightLeft, AlertCircle, Video, MapPin, MapPinned, X } from "lucide-react";
import LocationChangeModal from "../../components/shared/LocationChangeModal";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import ConfirmationModal from "../../components/ui/confirmation/ConfirmationModal";
import {
  getParentSchedules, requestParentReschedule, getParentRescheduleRequests, cancelParentRescheduleRequest,
  requestParentLocationChange, cancelParentLocationRequest, getParentLocationRequests, SESSION_STATUS, ATTENDANCE_LABEL, REQUEST_STATUS, formatSessionDate, dateOffset,
} from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { currentPeriod } from "@/utils/format";
import LocationRequestList from "../../components/shared/LocationRequestList";

const RANGES = [
  { value: "week", label: "7 Hari" },
  { value: "two_weeks", label: "14 Hari" },
  { value: "month", label: "Per Bulan" },
];

const rangeDates = (range, month) => {
  if (range === "week") return { from: dateOffset(0), to: dateOffset(6) };
  if (range === "two_weeks") return { from: dateOffset(0), to: dateOffset(13) };
  const [year, m] = month.split("-").map(Number);
  const last = new Date(year, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
};

export default function ParentSchedulePage() {
  const [range, setRange] = useState("week");
  const [month, setMonth] = useState(currentPeriod());
  const [childFilter, setChildFilter] = useState("");
  const [sessions, setSessions] = useState([]);
  const [children, setChildren] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [locating, setLocating] = useState(null);
  const [locationRequests, setLocationRequests] = useState([]);
  const [confirm, setConfirm] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    try {
      const [sched, reqs, locs] = await Promise.all([
        getParentSchedules({ ...rangeDates(range, month), student_id: childFilter || undefined }),
        getParentRescheduleRequests(),
        getParentLocationRequests(),
      ]);
      setLocationRequests(locs.data.data || []);
      setSessions(sched.data.data || []);
      setChildren(sched.data.children || []);
      setRequests(reqs.data.data || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat jadwal."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); load(); }, [range, month, childFilter]);

  const grouped = useMemo(() => {
    const map = {};
    sessions.forEach((s) => { (map[s.session_date] ||= []).push(s); });
    return Object.entries(map);
  }, [sessions]);

  const handleCancel = (req) => setConfirm({
    open: true,
    title: "Batalkan Pengajuan?",
    message: `Pengajuan pindah jadwal ${req.session?.subject_name} (${formatSessionDate(req.original_date)}) akan dibatalkan.`,
    variant: "warning",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        const res = await cancelParentRescheduleRequest(req.id);
        showSuccess(res.data.message);
        load();
      } catch (err) {
        showError(getApiErrorMessage(err, "Gagal membatalkan pengajuan."));
      }
    },
  });

  // Anak pertama di sesi dipakai sebagai acuan kepemilikan sesi
  const submitLocation = async (form) => {
    const res = await requestParentLocationChange(locating.id, { ...form, student_id: locating.children[0]?.id });
    setLocating(null);
    showSuccess(res.data.message);
    load();
  };

  const handleCancelLocation = (session) => setConfirm({
    open: true,
    title: "Batalkan Pengajuan Lokasi?",
    message: `Pengajuan lokasi "${session.my_location_request.location_name}" untuk sesi ${session.subject_name} akan dibatalkan.`,
    variant: "warning",
    onConfirm: async () => {
      setConfirm({ open: false });
      try {
        const res = await cancelParentLocationRequest(session.my_location_request.id);
        showSuccess(res.data.message);
        load();
      } catch (err) {
        showError(getApiErrorMessage(err, "Gagal membatalkan pengajuan."));
      }
    },
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Jadwal Belajar</h1>
            <p className="text-base text-gray-500 mt-1">Agenda sesi kelas anak, kehadiran, dan pengajuan pindah jadwal.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {RANGES.map((r) => (
                <button key={r.value} onClick={() => setRange(r.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${range === r.value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{r.label}</button>
              ))}
            </div>
            {range === "month" && <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="rounded-xl border px-3 py-2 text-sm bg-white" />}
            {children.length > 1 && (
              <select value={childFilter} onChange={(e) => setChildFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm bg-white">
                <option value="">Semua anak</option>
                {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400 font-medium">Memuat jadwal...</p>
        ) : grouped.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 italic">Tidak ada sesi pada rentang ini.</div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <p className="text-sm font-black text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {formatSessionDate(date)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((s) => <SessionCard key={s.id} session={s} onRequest={() => setRequesting(s)} onRequestLocation={() => setLocating(s)} onCancelLocation={() => handleCancelLocation(s)} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900">Riwayat Pengajuan Pindah Jadwal</div>
          {requests.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Belum ada pengajuan.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((r) => (
                <div key={r.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{r.session?.subject_name} • {r.session?.class_name}{r.student_name && ` • ${r.student_name}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatSessionDate(r.original_date, { day: "numeric", month: "short" })} {r.original_start_time} → <b className="text-gray-800">{formatSessionDate(r.proposed_date, { weekday: "short", day: "numeric", month: "short" })} {r.proposed_start_time}-{r.proposed_end_time}</b>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Alasan: {r.reason}</p>
                    {r.review_note && <p className={`text-xs mt-0.5 ${r.status === "REJECTED" ? "text-rose-600" : "text-emerald-700"}`}>Catatan Admin: {r.review_note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
                    {r.status === "PENDING" && <button onClick={() => handleCancel(r)} className="text-xs font-bold text-gray-500 hover:text-rose-600">Batalkan</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RescheduleModal
        session={requesting}
        onClose={() => setRequesting(null)}
        onDone={(message) => { setRequesting(null); showSuccess(message); load(); }}
      />
      <div className="px-6 pb-6"><LocationRequestList requests={locationRequests} onCancel={(r) => handleCancelLocation({ subject_name: r.session?.subject_name, my_location_request: r })} /></div>
      <LocationChangeModal open={!!locating} session={locating} onClose={() => setLocating(null)} onSubmit={submitLocation} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
    </div>
  );
}

function SessionCard({ session, onRequest, onRequestLocation, onCancelLocation }) {
  const pending = session.my_request?.status === "PENDING";
  const locationRequest = session.my_location_request;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">{session.subject_name}</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${SESSION_STATUS[session.status]?.className}`}>{SESSION_STATUS[session.status]?.label}</span>
        </div>
        <div className="text-sm font-semibold text-gray-600 space-y-1.5">
          <p className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> <span className="font-mono">{session.start_time} - {session.end_time} WIB</span></p>
          <p className="flex items-center gap-2"><User size={16} className="text-gray-400" /> {session.tentor_name || "-"} • {session.class_name}</p>
          {session.class_type === "ONLINE" ? (
            <p className="flex items-center gap-2"><Video size={16} className="text-gray-400" /> {session.meeting_url ? <a href={session.meeting_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">Link kelas online</a> : "Online (link menyusul)"}</p>
          ) : (session.location_name || session.room_name) && (
            <p className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {[session.location_name, session.room_name].filter(Boolean).join(" • ")}</p>
          )}
          {session.note && <p className="text-xs text-indigo-600">Dipindah: {session.note}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {session.children.map((c) => (
            <span key={c.id} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-gray-700">
              {c.name}
              {c.attendance_status && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${ATTENDANCE_LABEL[c.attendance_status]?.className}`}>{ATTENDANCE_LABEL[c.attendance_status]?.label}</span>}
            </span>
          ))}
        </div>
      </div>

      {pending ? (
        <p className="mt-4 text-xs font-bold text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          Pengajuan pindah ke {formatSessionDate(session.my_request.proposed_date, { weekday: "short", day: "numeric", month: "short" })} {session.my_request.proposed_start_time} menunggu Admin.
        </p>
      ) : session.can_request && (
        <button onClick={onRequest} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:text-amber-700 text-gray-700 font-bold text-xs rounded-xl">
          <ArrowRightLeft size={14} /> Ajukan Pindah Jadwal
        </button>
      )}

      {locationRequest && (
        <div className="mt-2 text-xs flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-gray-600">Lokasi sementara "{locationRequest.location_name}":</span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${REQUEST_STATUS[locationRequest.status]?.className}`}>{REQUEST_STATUS[locationRequest.status]?.label}</span>
          {locationRequest.review_note && <span className="text-gray-500">{locationRequest.review_note}</span>}
          {locationRequest.status === "PENDING" && <button onClick={onCancelLocation} className="font-bold text-gray-500 hover:text-rose-600">Batalkan</button>}
        </div>
      )}
      {session.can_request_location && (
        <button onClick={onRequestLocation} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-gray-700 font-bold text-xs rounded-xl">
          <MapPinned size={14} /> Ajukan Lokasi Les Sementara
        </button>
      )}
    </div>
  );
}

function RescheduleModal({ session, onClose, onDone }) {
  const [form, setForm] = useState({ proposed_date: "", proposed_start_time: "", reason: "", student_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    setForm({ proposed_date: "", proposed_start_time: session.start_time, reason: "", student_id: session.children.length === 1 ? session.children[0].id : "" });
    setError("");
  }, [session]);

  if (!session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await requestParentReschedule(session.id, { ...form, student_id: form.student_id || undefined });
      onDone(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal mengirim pengajuan."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-950 tracking-tight">Ajukan Pindah Jadwal</h3>
            <p className="text-xs text-gray-500">{session.subject_name} • {formatSessionDate(session.session_date, { weekday: "short", day: "numeric", month: "short" })} {session.start_time}-{session.end_time}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl flex items-start gap-2 text-xs font-medium">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Sesi ini diikuti seluruh siswa kelas {session.class_name}. Admin akan menyesuaikan dengan jadwal tentor & siswa lain, dan dapat mengusulkan jam berbeda.</span>
          </div>
          {session.children.length > 1 && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Untuk Anak</label>
              <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm bg-white">
                <option value="">Semua anak di kelas ini</option>
                {session.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Tanggal Pengganti</label>
              <input type="date" min={dateOffset(0)} required value={form.proposed_date} onChange={(e) => setForm({ ...form, proposed_date: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Jam Mulai</label>
              <input type="time" required value={form.proposed_start_time} onChange={(e) => setForm({ ...form, proposed_start_time: e.target.value })} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Alasan</label>
            <textarea required minLength={5} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Contoh: Anak ada ujian sekolah di jam yang sama." className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm min-h-[70px]" />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 font-bold text-sm rounded-xl hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">{saving ? "Mengirim..." : "Kirim Pengajuan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
