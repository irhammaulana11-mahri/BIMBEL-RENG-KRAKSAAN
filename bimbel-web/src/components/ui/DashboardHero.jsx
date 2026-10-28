import React from "react";

const GRADIENTS = {
  indigo: "from-indigo-700 via-indigo-600 to-blue-600",
  emerald: "from-emerald-700 via-emerald-600 to-teal-500",
  blue: "from-blue-700 via-blue-600 to-sky-500",
  purple: "from-purple-700 via-violet-600 to-indigo-500",
};

// Banner pembuka dashboard semua role: judul, keterangan, tanggal hari ini, dan aksi opsional
export default function DashboardHero({ title, subtitle, tone = "indigo", children }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${GRADIENTS[tone] || GRADIENTS.indigo} p-6 text-white shadow-md`}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute right-24 -bottom-12 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">{today}</p>
          <h1 className="text-3xl font-black tracking-tight mt-1">{title}</h1>
          {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
        </div>
        {children && <div className="relative">{children}</div>}
      </div>
    </div>
  );
}
