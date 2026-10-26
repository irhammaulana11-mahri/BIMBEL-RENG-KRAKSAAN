import React from "react";

export default function PremiumStatCard({ title, value, desc, icon: Icon, colorClass }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{desc}</p>
      </div>
      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300 ${colorClass}`}>
        {/* Render icon secara dinamis jika komponen icon dikirimkan */}
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}