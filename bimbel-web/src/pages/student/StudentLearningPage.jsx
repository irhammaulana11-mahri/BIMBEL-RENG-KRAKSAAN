import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, Video, MapPin, X, ChevronRight, Hourglass, CheckCircle2, PlayCircle } from "lucide-react";
import MaterialItem from "@/components/student/MaterialItem";
import { getStudentSessions, getStudentSession, ACTIVITY_TYPE } from "@/services/student/learningService";
import { SESSION_STATUS, ATTENDANCE_LABEL, formatSessionDate, dateOffset } from "@/services/parent/parentService";
import { getApiErrorMessage } from "@/utils/apiError";
import { currentPeriod } from "@/utils/format";

const RANGES = [
  { value: "upcoming", label: "7 Hari ke Depan" },
  { value: "past", label: "7 Hari Lalu" },
  { value: "month", label: "Per Bulan" },
];

const rangeDates = (range, month) => {
  if (range === "upcoming") return { from: dateOffset(0), to: dateOffset(7) };
  if (range === "past") return { from: dateOffset(-7), to: dateOffset(0) };
  const [year, m] = month.split("-").map(Number);
  return { from: `${month}-01`, to: `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}` };
};

export default function StudentLearningPage() {
  const [range, setRange] = useState("upcoming");
  const [month, setMonth] = useState(currentPeriod());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    getStudentSessions(rangeDates(range, month))
      .then((res) => {
        const data = res.data.data || [];
        setSessions(range === "past" ? [...data].reverse() : data);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat jadwal.")))
      .finally(() => setLoading(false));
  }, [range, month]);

  const grouped = useMemo(() => {
    const map = {};
    sessions.forEach((s) => { (map[s.session_date] ||= []).push(s); });
    return Object.entries(map);
  }, [sessions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pembelajaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jadwal sesi kelas, kehadiran Anda, dan aktivitas yang dibahas di setiap sesi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {RANGES.map((r) => (
              <button key={r.value} onClick={() => setRange(r.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${range === r.value ? "bg-white text-indigo-600 shadow-xs" : "text-gray-500"}`}>{r.label}</button>
            ))}
          </div>
          {range === "month" && <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="rounded-xl border px-3 py-2 text-sm bg-white" />}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <p className="p-10 text-center text-sm text-gray-400">Memuat jadwal...</p>
      ) : grouped.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">Tidak ada sesi pada rentang ini.</div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="text-sm font-black text-gray-700 mb-2 flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {formatSessionDate(date)}</p>
              <div className="space-y-3">
                {items.map((s) => <SessionRow key={s.id} session={s} onOpen={() => setSelected(s.id)} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionDetailModal sessionId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function SessionRow({ session, onOpen, showDate = false }) {
  return (
    <button onClick={onOpen} className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 hover:border-indigo-300 transition-colors">
      <div className="flex flex-col items-center justify-center w-16 shrink-0 bg-indigo-50 text-indigo-700 rounded-xl py-2">
        {showDate && <span className="text-[10px] font-bold">{formatSessionDate(session.session_date, { weekday: "short", day: "numeric" })}</span>}
        <span className="text-sm font-black font-mono">{session.start_time}</span>
        <span className="text-[10px] font-semibold opacity-70">s/d {session.end_time}</span>
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-gray-900">{session.subject_name}</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[session.status]?.className}`}>{SESSION_STATUS[session.status]?.label}</span>
          {session.attendance_status && <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ATTENDANCE_LABEL[session.attendance_status]?.className}`}>{ATTENDANCE_LABEL[session.attendance_status]?.label}</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><User size={12} /> {session.tentor_name || "-"} • {session.class_name}</p>
        {session.activities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {session.activities.map((a) => (
              <span key={a.id} className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTIVITY_TYPE[a.type]?.className}`}>{ACTIVITY_TYPE[a.type]?.label}: {a.title}</span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </button>
  );
}

export function SessionDetailModal({ sessionId, onClose }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    setSession(null);
    setError("");
    getStudentSession(sessionId)
      .then((res) => setSession(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat sesi.")));
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          {session ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[session.status]?.className}`}>{SESSION_STATUS[session.status]?.label}</span>
                {session.attendance_status && <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ATTENDANCE_LABEL[session.attendance_status]?.className}`}>Kehadiran: {ATTENDANCE_LABEL[session.attendance_status]?.label}</span>}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{session.subject_name}</h2>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                <p className="flex items-center gap-1.5"><Clock size={12} /> {formatSessionDate(session.session_date)} • {session.start_time}-{session.end_time} WIB</p>
                <p className="flex items-center gap-1.5"><User size={12} /> {session.tentor_name || "-"} • {session.class_name}</p>
                {session.class_type === "ONLINE" ? (
                  <p className="flex items-center gap-1.5"><Video size={12} /> {session.meeting_url ? <a href={session.meeting_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Masuk kelas online</a> : "Link kelas menyusul"}</p>
                ) : (session.location_name || session.room_name) && (
                  <p className="flex items-center gap-1.5"><MapPin size={12} /> {[session.location_name, session.room_name].filter(Boolean).join(" • ")}</p>
                )}
              </div>
            </>
          ) : <p className="text-sm text-gray-400">{error || "Memuat sesi..."}</p>}
        </div>

        {session && (
          <div className="p-6 overflow-y-auto space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase">Aktivitas Sesi</p>
            {session.activities.length === 0 && <p className="text-sm text-gray-400">Tentor belum menambahkan aktivitas untuk sesi ini.</p>}
            {session.activities.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTIVITY_TYPE[a.type]?.className}`}>{ACTIVITY_TYPE[a.type]?.label}</span>
                    <p className="font-bold text-gray-900">{a.title}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold">
                    {a.start_time && `${a.start_time}-${a.end_time} • `}
                    {a.status === "COMPLETED" ? "Selesai" : a.status === "IN_PROGRESS" ? "Berlangsung" : "Direncanakan"}
                  </span>
                </div>
                {a.description && <p className="text-sm text-gray-600">{a.description}</p>}
                {a.material && <MaterialItem material={a.material} />}
                {a.exam && <ExamActivityStatus exam={a.exam} activityStatus={a.status} onOpen={(path) => navigate(path)} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamActivityStatus({ exam, activityStatus, onOpen }) {
  const box = "flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl text-sm";

  if (exam.result_status === "GRADED") {
    return (
      <div className={`${box} bg-emerald-50 text-emerald-800`}>
        <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 size={16} /> {exam.title}: nilai <b>{exam.score}/{exam.total_score}</b></span>
        <button onClick={() => onOpen(`/student/exams/${exam.result_id}`)} className="text-xs font-bold underline">Lihat hasil</button>
      </div>
    );
  }
  if (exam.result_status === "SUBMITTED") {
    return <div className={`${box} bg-amber-50 text-amber-800`}><span className="flex items-center gap-1.5 font-semibold"><Hourglass size={16} /> {exam.title}: sudah dikumpulkan, menunggu penilaian tentor.</span></div>;
  }
  if (activityStatus === "IN_PROGRESS") {
    return (
      <div className={`${box} bg-purple-50 text-purple-800`}>
        <span className="font-semibold">{exam.title} sedang dibuka{exam.duration && ` • ${exam.duration} menit`}</span>
        <button onClick={() => onOpen("/student/exams")} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><PlayCircle size={14} /> Kerjakan</button>
      </div>
    );
  }
  return <div className={`${box} bg-slate-50 text-gray-600`}><span>{exam.title}{activityStatus === "COMPLETED" ? " — tidak dikerjakan." : " — dibuka oleh tentor saat sesi berlangsung."}</span></div>;
}
