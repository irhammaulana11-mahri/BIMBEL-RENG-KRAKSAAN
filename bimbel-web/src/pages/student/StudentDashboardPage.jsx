import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Award, Hourglass, PlayCircle, CheckCircle2 } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { getStudentExams } from "@/services/exam/examService";
import { getStudentDashboard } from "@/services/student/learningService";
import { formatPercent } from "@/services/academic/progressReportService";
import MaterialItem from "@/components/student/MaterialItem";
import { SessionRow, SessionDetailModal } from "./StudentLearningPage";
import DashboardHero from "../../components/ui/DashboardHero";
import PremiumStatCard from "../../components/ui/StatCard";
import Panel from "../../components/ui/DashboardPanel";

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({ available: [], upcoming: [], history: [] });
  const [learning, setLearning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    getStudentExams()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    getStudentDashboard()
      .then(res => setLearning(res.data.data))
      .catch(() => {});
  }, []);

  const graded = data.history.filter(r => r.status === "GRADED");
  const average = graded.length ? Math.round(graded.reduce((sum, r) => sum + Number(r.score), 0) / graded.length * 10) / 10 : "-";
  const waiting = data.history.filter(r => r.status === "SUBMITTED").length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6 space-y-6">
        <DashboardHero
          title={`Halo, ${user?.name || "Siswa"} 👋`}
          subtitle={`Ringkasan jadwal, materi, dan hasil belajar Anda.${learning?.classes?.length ? ` Kelas: ${learning.classes.map(c => c.name).join(", ")}` : ""}`}
          tone="purple"
        >
          {data.available.length > 0 && (
            <button onClick={() => navigate("/student/exams")} className="px-5 py-3 bg-white text-indigo-700 rounded-xl text-sm font-black flex items-center gap-2 shadow w-full md:w-auto justify-center">
              <PlayCircle size={16}/> Kerjakan Ujian ({data.available.length})
            </button>
          )}
        </DashboardHero>

        {learning && learning.classes.length === 0 && (
          <p className="text-sm bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-4 py-3">Anda belum ditempatkan di kelas. Hubungi Admin bimbel.</p>
        )}
        {data.available.length > 0 && (
          <p className="text-sm bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2">
            <PlayCircle size={16} /> Ujian sedang dibuka: <b>{data.available[0].title}</b>{data.available.length > 1 ? ` (+${data.available.length - 1} lainnya)` : ""}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <PremiumStatCard title={`Kehadiran ${learning?.attendance.period || ""}`} value={learning ? formatPercent(learning.attendance.percentage) : "…"} desc={learning ? `Hadir ${learning.attendance.hadir} dari ${learning.attendance.held_sessions} sesi` : ""} icon={CheckCircle2} colorClass="text-emerald-700" />
          <PremiumStatCard title="Ujian Dikerjakan" value={loading ? "…" : data.history.length} desc="Total ujian online" icon={ClipboardCheck} colorClass="text-blue-700" />
          <PremiumStatCard title="Rata-rata Nilai" value={loading ? "…" : average} desc="Ujian yang sudah dinilai" icon={Award} colorClass="text-indigo-700" />
          <PremiumStatCard title="Menunggu Penilaian" value={loading ? "…" : waiting} desc="Essay sedang dinilai tentor" icon={Hourglass} colorClass="text-amber-700" />
        </div>

        {learning && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Panel title="Jadwal Hari Ini & Mendatang" link={{ to: "/student/learning", label: "Semua jadwal" }} tone="blue">
              <div className="space-y-3">
                {learning.today_sessions.length === 0 && learning.upcoming_sessions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Tidak ada sesi dalam 7 hari ke depan.</p>}
                {[...learning.today_sessions, ...learning.upcoming_sessions].map(s => <SessionRow key={s.id} session={s} showDate onOpen={() => setSelectedSession(s.id)} />)}
              </div>
            </Panel>
            <Panel title="Materi Terakhir Dibahas" link={{ to: "/student/materials", label: "Semua materi" }} tone="emerald">
              <div className="divide-y divide-gray-100">
                {learning.recent_materials.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada materi yang dibahas di kelas.</p>}
                {learning.recent_materials.map(m => <MaterialItem key={m.id} material={m} compact />)}
              </div>
            </Panel>
          </div>
        )}

        {graded.length > 0 && (
          <Panel title="Hasil Terbaru" link={{ to: "/student/exams", label: "Lihat semua" }} tone="purple">
            <div className="divide-y divide-gray-50">
              {graded.slice(0, 5).map(r => (
                <button key={r.id} onClick={() => navigate(`/student/exams/${r.id}`)} className="w-full text-left py-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{r.exam_title}</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase">{r.subject_name}</p>
                  </div>
                  <span className="text-lg font-black text-indigo-700">{r.score}</span>
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>
      <SessionDetailModal sessionId={selectedSession} onClose={() => setSelectedSession(null)} />
    </div>
  );
}
