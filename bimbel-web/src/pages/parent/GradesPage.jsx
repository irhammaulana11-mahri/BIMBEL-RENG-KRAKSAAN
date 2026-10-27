import React from "react";
import PublishedReportsBrowser from "@/components/report/PublishedReportsBrowser";

export default function ParentGradesPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Perkembangan Nilai</h1>
        <p className="text-base text-gray-500 mt-1">Rapor bulanan dan rekap semester anak: kehadiran, nilai ujian, dan catatan tentor.</p>
      </div>
      <PublishedReportsBrowser role="parent" />
    </div>
  );
}
