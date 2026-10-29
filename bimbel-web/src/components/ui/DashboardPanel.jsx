import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Warna aksen garis atas panel
const TONES = {
  blue: "border-t-blue-500", amber: "border-t-amber-500", emerald: "border-t-emerald-500",
  purple: "border-t-purple-500", indigo: "border-t-indigo-500", rose: "border-t-rose-500",
};

// Kotak isi dashboard semua role: judul, tautan opsional, dan garis aksen berwarna (gaya dashboard admin)
export default function DashboardPanel({ title, link, tone = "blue", className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${TONES[tone] || TONES.blue} p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">{title}</h3>
        {link && <Link to={link.to} className="text-xs font-bold text-blue-600 flex items-center gap-1">{link.label} <ArrowRight size={12} /></Link>}
      </div>
      {children}
    </div>
  );
}
