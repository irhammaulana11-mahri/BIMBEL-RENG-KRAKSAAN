import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import SemesterReportView from "@/components/report/SemesterReportView";
import { getApiErrorMessage } from "@/utils/apiError";

/**
 * Rekap semester satu siswa-kelas. loader(params) memanggil endpoint sesuai peran.
 */
export default function SemesterDetailModal({ target, semester, loader, onClose }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!target) return;
    setReport(null);
    setError("");
    loader({ ...semester, class_id: target.class_id, student_id: target.student_id })
      .then((res) => setReport(res.data.data))
      .catch((err) => setError(getApiErrorMessage(err, "Gagal memuat rekap semester.")));
  }, [target, semester, loader]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl relative max-h-[92vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Rekap Semester</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{target.student_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{report?.label} • {target.class_name}</p>
        </div>
        <div className="p-6 overflow-y-auto">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!report && !error && <p className="text-center text-sm text-gray-400 py-10">Memuat rekap...</p>}
          {report && <SemesterReportView report={report} />}
        </div>
      </div>
    </div>
  );
}
