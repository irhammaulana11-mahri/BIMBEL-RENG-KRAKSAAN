import React from "react";
import { Sparkles, Star, Sprout, BookOpen, Home, Brain } from "lucide-react";

// Bagian rekomendasi perkembangan pada rapor (disusun AI, ditinjau Admin)
export const RECOMMENDATION_SECTIONS = [
  { key: "strengths", label: "Kekuatan Ananda", icon: Star, tone: "bg-emerald-50 border-emerald-100 text-emerald-800" },
  { key: "growth_areas", label: "Area untuk Dikembangkan", icon: Sprout, tone: "bg-amber-50 border-amber-100 text-amber-800" },
  { key: "learning_recommendations", label: "Rekomendasi Belajar (Tentor)", icon: BookOpen, tone: "bg-blue-50 border-blue-100 text-blue-800" },
  { key: "parent_tips", label: "Saran Pendampingan di Rumah", icon: Home, tone: "bg-purple-50 border-purple-100 text-purple-800" },
];

export default function RecommendationView({ recommendation }) {
  if (!recommendation) return null;
  const r = recommendation;

  return (
    <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
      <p className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Rekomendasi Perkembangan</p>
      {r.summary && <p className="text-sm text-gray-800 whitespace-pre-line">{r.summary}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RECOMMENDATION_SECTIONS.filter((s) => r[s.key]?.length).map((s) => (
          <div key={s.key} className={`p-3 rounded-xl border ${s.tone}`}>
            <p className="text-[11px] font-black uppercase flex items-center gap-1.5"><s.icon className="w-3.5 h-3.5" /> {s.label}</p>
            <ul className="mt-1.5 list-disc pl-4 space-y-1 text-sm text-gray-700">
              {r[s.key].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      {r.developmental_note && (
        <div className="p-3 rounded-xl border border-slate-200 bg-white">
          <p className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Catatan Tumbuh Kembang</p>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{r.developmental_note}</p>
        </div>
      )}
      <p className="text-[10px] text-gray-400">Disusun dengan bantuan AI berdasarkan kehadiran, nilai ujian, dan catatan tentor, lalu ditinjau pihak bimbel. Bukan diagnosis psikologis.</p>
    </div>
  );
}
