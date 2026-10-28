import React from "react";
import { MapPin } from "lucide-react";
import { REQUEST_STATUS, formatSessionDate } from "@/services/parent/parentService";
import { mapsLink } from "@/utils/geo";

// Riwayat pengajuan lokasi les sementara milik pengguna (tentor / orang tua)
export default function LocationRequestList({ requests = [], onCancel }) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900 text-sm flex items-center gap-2">
        <MapPin size={16} className="text-purple-600" /> Riwayat Pengajuan Lokasi Sementara
      </div>
      <div className="divide-y divide-gray-100">
        {requests.map((r) => (
          <div key={r.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-bold text-gray-900">{r.session?.subject_name} • {r.session?.class_name}{r.student_name && ` • ${r.student_name}`}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatSessionDate(r.session?.session_date, { weekday: "short", day: "numeric", month: "short" })} {r.session?.start_time} → <b className="text-gray-800">{r.location_name}</b>
                {" • "}<a href={mapsLink(r.latitude, r.longitude)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">peta</a>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{r.address} • Alasan: {r.reason}</p>
              {r.review_note && <p className={`text-xs mt-0.5 ${r.status === "REJECTED" ? "text-rose-600" : "text-emerald-700"}`}>Catatan Admin: {r.review_note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REQUEST_STATUS[r.status]?.className}`}>{REQUEST_STATUS[r.status]?.label}</span>
              {r.status === "PENDING" && onCancel && <button onClick={() => onCancel(r)} className="text-xs font-bold text-gray-500 hover:text-rose-600">Batalkan</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
