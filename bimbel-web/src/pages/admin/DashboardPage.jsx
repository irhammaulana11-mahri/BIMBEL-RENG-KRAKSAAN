import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, School, CalendarCheck, ArrowRight, Clock, Inbox, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, FileCheck2, Wallet } from "lucide-react";
import { getDashboard } from "@/services/admin/dashboardService";
import { SESSION_STATUS } from "@/services/parent/parentService";
import { PAYROLL_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";
import StatCard from "../../components/ui/StatCard";
import DashboardHero from "../../components/ui/DashboardHero";
import Panel from "../../components/ui/DashboardPanel";


// Warna batang distribusi paket
const BAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500"];

const LEAD_STATUS = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  FOLLOW_UP: "bg-purple-50 text-purple-700",
  REGISTERED: "bg-emerald-50 text-emerald-700",
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat dashboard.")));
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center min-h-[60vh] text-base text-gray-500 font-medium">{error || "Memuat dashboard..."}</div>;
  }

  const { stats, finance, inbox, month_close: close } = data;
  const pendingTotal = inbox.reduce((sum, i) => sum + i.count, 0);
  const maxTrend = Math.max(1, ...finance.trend.flatMap((t) => [t.income, t.out]));
  const maxPackage = Math.max(1, ...data.package_distribution.map((p) => p.total));

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6 space-y-6">
        <DashboardHero title="Dashboard Admin" subtitle={`Ringkasan operasional bimbel periode ${data.period}.`}>
          {pendingTotal > 0 && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
              <AlertTriangle size={16} /> {pendingTotal} hal perlu tindakan
            </span>
          )}
        </DashboardHero>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Siswa Aktif" value={stats.active_students} desc={`${stats.enrolled_students} sudah ditempatkan di kelas`} icon={GraduationCap} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Tentor Aktif" value={stats.active_tentors} desc="Tentor dengan status aktif" icon={BookOpen} colorClass="bg-indigo-50 text-indigo-600" />
          <StatCard title="Kelas Aktif" value={stats.active_classes} desc="Kelas berjalan" icon={School} colorClass="bg-purple-50 text-purple-600" />
          <StatCard title="Sesi Bulan Ini" value={stats.sessions_month} desc={`${stats.sessions_done} sudah selesai`} icon={CalendarCheck} colorClass="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Arus kas bulan berjalan */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-5">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-400" /> Arus Kas {data.period}</h3>
              <Link to="/admin/cashflow" className="text-xs font-bold text-blue-300 flex items-center gap-1">Detail <ArrowRight size={12} /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-emerald-400" /> Kas Masuk</p>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{formatRupiah(finance.income)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><ArrowDownRight className="w-4 h-4 text-rose-400" /> Kas Keluar</p>
                <p className="text-2xl font-black font-mono text-rose-400 mt-1">{formatRupiah(finance.payroll + finance.expenses)}</p>
                <p className="text-[11px] text-slate-400 font-mono">Honor {formatRupiah(finance.payroll)} • Ops {formatRupiah(finance.expenses)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Arus Kas Bersih</p>
                <p className={`text-2xl font-black font-mono mt-1 ${finance.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatRupiah(finance.net)}</p>
                <p className="text-[11px] text-slate-400">Piutang {formatRupiah(finance.receivables.total)} ({finance.receivables.count} tagihan)</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-24 mt-6">
              {finance.trend.map((t) => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1" title={`${t.label}: masuk ${formatRupiah(t.income)}, keluar ${formatRupiah(t.out)}`}>
                  <div className="w-full flex items-end gap-0.5 h-20">
                    <div className="flex-1 bg-emerald-400 rounded-t" style={{ height: `${t.income / maxTrend * 100}%` }} />
                    <div className="flex-1 bg-rose-400 rounded-t" style={{ height: `${t.out / maxTrend * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pekerjaan tertunda */}
          <Panel title={`Perlu Tindakan (${pendingTotal})`} tone="amber">
            <div className="space-y-2">
              {inbox.map((item) => (
                <Link key={item.key} to={item.link} className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${item.count > 0 ? "bg-amber-50 hover:bg-amber-100 text-amber-900" : "text-gray-400 hover:bg-gray-50"}`}>
                  <span className="flex items-center gap-2 font-semibold">{item.count > 0 ? <AlertTriangle size={14} /> : <Inbox size={14} />} {item.label}</span>
                  <span className="font-black">{item.count}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <Panel title="Sesi Hari Ini" link={{ to: "/admin/schedules", label: "Jadwal" }} tone="blue">
              {data.today_sessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Tidak ada sesi hari ini.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.today_sessions.map((s) => (
                    <div key={s.id} className="py-3 flex flex-wrap items-center gap-3 border-l-4 pl-3 rounded-sm" style={{ borderColor: s.checked_in ? "#10b981" : "#f59e0b" }}>
                      <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1"><Clock size={13} /> {s.start_time}-{s.end_time}</span>
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-bold text-gray-900">{s.subject_name} • {s.class_name}</p>
                        <p className="text-xs text-gray-500">{s.tentor_name || "Tentor belum ditentukan"}{s.checked_in && " • sudah check-in"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SESSION_STATUS[s.status]?.className}`}>{SESSION_STATUS[s.status]?.label || s.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title={`Tutup Buku ${close.previous_period}`} tone="emerald">
            <div className="space-y-3 text-sm">
              <Link to="/admin/rapor" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <span className="flex items-center gap-2 font-semibold text-gray-700"><FileCheck2 size={16} className="text-indigo-500" /> Rapor terbit</span>
                <span className={`font-black ${close.reports_expected > 0 && close.reports_published >= close.reports_expected ? "text-emerald-600" : "text-amber-600"}`}>{close.reports_published}/{close.reports_expected}</span>
              </Link>
              <Link to="/admin/finance" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <span className="flex items-center gap-2 font-semibold text-gray-700"><Wallet size={16} className="text-emerald-500" /> Payroll honor tentor</span>
                {close.payroll_status
                  ? <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${PAYROLL_STATUS[close.payroll_status]?.className}`}>{PAYROLL_STATUS[close.payroll_status]?.label}</span>
                  : <span className="text-xs font-bold text-amber-600">Belum disusun</span>}
              </Link>
              {close.reports_expected > 0 && close.reports_published >= close.reports_expected && close.payroll_status === "PAID" && (
                <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} /> Rapor & honor bulan lalu sudah tuntas.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <Panel title="Lead Terbaru" link={{ to: "/admin/leads", label: "Semua lead" }} tone="purple">
              {data.recent_leads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada lead.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recent_leads.map((lead) => (
                    <div key={lead.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{lead.student_name} <span className="text-gray-400 font-medium">• ortu {lead.parent_name}</span></p>
                        <p className="text-xs text-gray-500">{lead.education_level}{lead.package_name && ` • ${lead.package_name}`} • {lead.created_at}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${LEAD_STATUS[lead.status] || "bg-gray-100 text-gray-600"}`}>{lead.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Siswa per Paket" tone="indigo">
            {data.package_distribution.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada siswa di kelas.</p>
            ) : (
              <div className="space-y-3">
                {data.package_distribution.map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs"><span className="text-gray-600 font-semibold">{p.name}</span><span className="font-black">{p.total}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full mt-1"><div className={`h-full rounded-full ${BAR_COLORS[data.package_distribution.indexOf(p) % BAR_COLORS.length]}`} style={{ width: `${p.total / maxPackage * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
