import React from "react";

// Nama kelas ditulis lengkap agar terbaca Tailwind; warna diambil dari colorClass yang dikirim halaman
const TONES = {
  indigo:  { card: "bg-indigo-50 border-indigo-100",   value: "text-indigo-700",  icon: "bg-indigo-500",  bar: "bg-indigo-500" },
  blue:    { card: "bg-blue-50 border-blue-100",       value: "text-blue-700",    icon: "bg-blue-500",    bar: "bg-blue-500" },
  green:   { card: "bg-green-50 border-green-100",     value: "text-green-700",   icon: "bg-green-500",   bar: "bg-green-500" },
  emerald: { card: "bg-emerald-50 border-emerald-100", value: "text-emerald-700", icon: "bg-emerald-500", bar: "bg-emerald-500" },
  red:     { card: "bg-red-50 border-red-100",         value: "text-red-700",     icon: "bg-red-500",     bar: "bg-red-500" },
  rose:    { card: "bg-rose-50 border-rose-100",       value: "text-rose-700",    icon: "bg-rose-500",    bar: "bg-rose-500" },
  amber:   { card: "bg-amber-50 border-amber-100",     value: "text-amber-700",   icon: "bg-amber-500",   bar: "bg-amber-500" },
  purple:  { card: "bg-purple-50 border-purple-100",   value: "text-purple-700",  icon: "bg-purple-500",  bar: "bg-purple-500" },
};

// "bg-green-50 text-green-700" -> green; kartu abu-abu (slate/gray) dijadikan indigo agar tetap berwarna
const toneOf = (colorClass = "") => {
  const name = colorClass.match(/text-([a-z]+)-\d+/)?.[1];
  return TONES[name] ? name : "indigo";
};

export default function PremiumStatCard({ title, value, desc, icon: Icon, colorClass, tone }) {
  const t = TONES[tone] || TONES[toneOf(colorClass)];

  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl border shadow-xs flex items-center justify-between group hover:shadow-md transition-all duration-300 ${t.card}`}>
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.bar}`} />
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className={`text-4xl font-black font-mono tracking-tight ${t.value}`}>{value}</p>
        <p className="text-xs text-gray-500 font-medium">{desc}</p>
      </div>
      <div className={`p-4 rounded-2xl text-white shadow-sm transition-transform group-hover:scale-105 duration-300 ${t.icon}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}
