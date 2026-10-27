import React from "react";
import PublishedReportsBrowser from "@/components/report/PublishedReportsBrowser";

export default function StudentReportPage() {
  return (
    <div className="page-card space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Rapor Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rapor bulanan dan rekap semester: kehadiran, nilai ujian, dan catatan dari tentor.</p>
      </div>
      <PublishedReportsBrowser role="student" />
    </div>
  );
}
