import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, CalendarDays, CreditCard, CheckCircle2, Clock, User, ArrowRight, ClipboardList, TrendingUp, Hourglass, AlertTriangle } from "lucide-react";
import PremiumStatCard from "../../components/ui/StatCard";
import { TrendBadge } from "@/components/report/ReportCardView";
import { getParentDashboard, SESSION_STATUS, ATTENDANCE_LABEL, formatSessionDate, dateOffset } from "@/services/parent/parentService";
import { formatScore, formatPercent } from "@/services/academic/progressReportService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod } from "@/utils/format";

function SessionRow({ session, showDate }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase">{session.class_name}</span>
          <h4 className="font-bold text-gray-950">{session.subject_name}</h4>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[session.status]?.className}`}>{SESSION_STATUS[session.status]?.label}</span>
        </div>
        <p className="text-xs font-semibold text-gray-600 flex flex-wrap items-center gap-1.5">
          <User size={14} className="text-gray-400" />
          {session.children.map((c) => (
            <span key={c.id} className="text-gray-900 font-bold">
              {c.name}
              {c.attendance_status && <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${ATTENDANCE_LABEL[c.attendance_status]?.className}`}>{ATTENDANCE_LABEL[c.attendance_status]?.label}</span>}
            </span>
          ))}
          <span>• {session.tentor_name || "Tentor belum ditentukan"}</span>
        </p>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
        {showDate && <span className="text-[11px] font-semibold text-gray-500">{formatSessionDate(session.session_date, { weekday: "short", day: "numeric", month: "short" })}</span>}
        <span className="flex items-center gap-1.5 text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg"><Clock size={14} /> {session.start_time} - {session.end_time}</span>
        <span className="text-[11px] font-semibold text-gray-400">{session.class_type === "ONLINE" ? "Online" : session.room_name || session.location_name || ""}</span>
      </div>
    </div>
  );
}

function Section({ icon: Icon, color, title, desc, link, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${color}`}><Icon size={20} /></div>
          <div>
            <h2 className="text-lg font-black text-gray-950 tracking-tight">{title}</h2>
            {desc && <p className="text-xs text-gray-400 font-medium">{desc}</p>}
          </div>
        </div>
        {link && <Link to={link.to} className="text-xs font-bold text-blue-600 flex items-center gap-1 shrink-0">{link.label} <ArrowRight size={12} /></Link>}
      </div>
      {children}
    </div>
  );
}

export default function ParentDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getParentDashboard()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat dashboard.")));
  }, []);

  if (!data) return <div className="p-12 text-center text-sm font-bold text-gray-400">{error || "Memuat dashboard..."}</div>;

  const { summary } = data;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Beranda Wali Murid</h1>
          <p className="text-base text-gray-500 mt-1">Selamat datang, {data.parent.name}. Pantau jadwal, kehadiran, nilai, dan administrasi belajar anak Anda.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <PremiumStatCard title="Anak Didik" value={`${summary.children_count}`} desc={`${summary.active_classes_count} kelas aktif`} icon={GraduationCap} colorClass="bg-blue-50 text-blue-600" />
          <PremiumStatCard title="Kehadiran" value={formatPercent(summary.attendance_percentage)} desc={`Sesi berlangsung ${summary.attendance_period}`} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
          <PremiumStatCard title="Tagihan Aktif" value={`${summary.open_invoices_count}`} desc={summary.overdue_count > 0 ? `${summary.overdue_count} lewat jatuh tempo` : "Belum lunas"} icon={CreditCard} colorClass="bg-amber-50 text-amber-600" />
          <PremiumStatCard title="Sisa Tagihan" value={formatRupiah(summary.outstanding)} desc="Total belum dibayar" icon={AlertTriangle} colorClass="bg-purple-50 text-purple-600" />
        </div>

        {summary.pending_requests > 0 && (
          <p className="mb-6 text-sm bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-2"><Hourglass size={16} /> {summary.pending_requests} pengajuan Anda sedang menunggu keputusan Admin.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Section icon={CalendarDays} color="bg-blue-50 text-blue-600" title="Jadwal Hari Ini" desc={formatSessionDate(dateOffset(0))} link={{ to: "/parent/schedule", label: "Semua jadwal" }}>
              {data.today_sessions.length === 0 ? (
                <p className="text-center py-4 text-gray-400 italic text-sm">Tidak ada sesi belajar hari ini.</p>
              ) : (
                <div className="space-y-3">{data.today_sessions.map((s) => <SessionRow key={s.id} session={s} />)}</div>
              )}
              {data.upcoming_sessions.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase pt-2">7 hari ke depan</p>
                  <div className="space-y-3">{data.upcoming_sessions.map((s) => <SessionRow key={s.id} session={s} showDate />)}</div>
                </>
              )}
            </Section>

            <Section icon={CreditCard} color="bg-amber-50 text-amber-600" title="Tagihan Aktif" link={{ to: "/parent/billing", label: "Bayar & riwayat" }}>
              {data.open_invoices.length === 0 ? (
                <p className="text-center py-4 text-emerald-600 font-semibold text-sm">Semua tagihan sudah lunas.</p>
              ) : (
                <div className="space-y-3">
                  {data.open_invoices.map((inv) => (
                    <div key={inv.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${inv.is_overdue ? "border-rose-200 bg-rose-50/30" : "border-amber-200/60 bg-amber-50/30"}`}>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-gray-400">{inv.invoice_no}</span>
                        <h4 className="font-bold text-gray-950 text-sm">{inv.period_month ? `SPP ${formatPeriod(`${inv.period_year}-${String(inv.period_month).padStart(2, "0")}`)}` : "Tagihan Lainnya"} • {inv.student_name}</h4>
                        <p className={`text-xs font-medium ${inv.is_overdue ? "text-rose-600" : "text-amber-700"}`}>Jatuh tempo {inv.due_date}{inv.has_pending_payment && " • bukti sedang diverifikasi"}</p>
                      </div>
                      <span className="text-lg font-black text-gray-950 font-mono">{formatRupiah(inv.remaining_amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <Section icon={ClipboardList} color="bg-purple-50 text-purple-600" title="Hasil Ujian Terbaru" link={{ to: "/parent/exam", label: "Semua" }}>
              {data.recent_results.length === 0 ? (
                <p className="text-center py-4 text-gray-400 italic text-sm">Belum ada ujian.</p>
              ) : (
                <div className="space-y-3">
                  {data.recent_results.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{r.exam_title}</p>
                        <p className="text-xs text-gray-400">{r.student_name} • {r.subject_name}</p>
                      </div>
                      {r.status === "GRADED"
                        ? <span className="font-black text-gray-900">{formatScore(r.score)}<span className="text-xs text-gray-400 font-semibold">/{r.total_score}</span></span>
                        : <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Dinilai tentor</span>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section icon={TrendingUp} color="bg-emerald-50 text-emerald-600" title="Rapor Terbaru" link={{ to: "/parent/grades", label: "Semua" }}>
              {data.latest_reports.length === 0 ? (
                <p className="text-center py-4 text-gray-400 italic text-sm">Belum ada rapor terbit.</p>
              ) : (
                <div className="space-y-3">
                  {data.latest_reports.map((r) => (
                    <div key={r.report_id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <p className="font-bold text-gray-900 text-sm">{r.period.label} • {r.student.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">Hadir {formatPercent(r.attendance_percentage)} • Nilai {formatScore(r.exam_average)} <TrendBadge trend={r.exam_trend} /></p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section icon={GraduationCap} color="bg-blue-50 text-blue-600" title="Anak Saya" link={{ to: "/parent/profile", label: "Profil" }}>
              <div className="space-y-2">
                {data.children.map((c) => (
                  <div key={c.id} className="text-sm">
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.classes.length ? c.classes.map((k) => k.name).join(", ") : "Belum ditempatkan di kelas"}</p>
                  </div>
                ))}
                {data.attendance.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {data.attendance.map((a, i) => (
                      <p key={i} className="text-[11px] text-gray-500">{a.student_name} ({a.class_name}): hadir {a.hadir}/{a.held} sesi bulan ini</p>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
