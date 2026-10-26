import React, { useEffect, useState } from "react";
import { Wallet, ChevronDown, ChevronUp, CheckCircle2, Hourglass } from "lucide-react";
import { getTentorHonor, PAYROLL_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

export default function TentorHonorPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getTentorHonor()
      .then(res => setData(res.data.data))
      .catch(err => setError(getApiErrorMessage(err, "Gagal memuat data honor.")));
  }, []);

  if (!data) return <div className="p-12 text-center text-sm font-bold text-gray-400">{error || "Memuat honor..."}</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Honor Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Honor dihitung dari tarif per sesi × sesi yang Anda hadiri dan selesaikan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase">Tarif per Sesi</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{data.rate_per_session > 0 ? formatRupiah(data.rate_per_session) : "Belum diatur"}</p>
        </div>
        <div className="sm:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-5">
          <p className="text-xs font-bold uppercase opacity-80 flex items-center gap-1"><Wallet size={13}/> Estimasi Honor Belum Dibayar</p>
          <p className="text-3xl font-black mt-1">{formatRupiah(data.estimate.total_amount)}</p>
          <p className="text-xs opacity-80 mt-1">{data.estimate.total_sessions} sesi belum masuk payroll (s/d {data.estimate.period_label})</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl">
        <div className="px-5 py-4 border-b border-gray-100 font-black text-gray-900">Riwayat Payroll</div>
        {data.history.length === 0 ? (
          <p className="p-8 text-center text-sm font-bold text-gray-400">Belum ada payroll.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.history.map(h => (
              <div key={h.payroll_id}>
                <button onClick={() => setExpanded(expanded === h.payroll_id ? null : h.payroll_id)} className="w-full text-left p-4 flex flex-wrap items-center gap-3 hover:bg-slate-50">
                  {expanded === h.payroll_id ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-bold text-gray-900">{h.period_label}</p>
                    <p className="text-xs text-gray-400">{h.payroll_no} • {h.total_sessions} sesi</p>
                  </div>
                  <p className="text-lg font-black text-gray-900">{formatRupiah(h.total_amount)}</p>
                  {h.transfer ? (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={13}/> Ditransfer {h.transfer.transfer_date}</span>
                  ) : (
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${PAYROLL_STATUS[h.payroll_status]?.className}`}><Hourglass size={13}/> {h.payroll_status === "APPROVED" ? "Menunggu transfer" : PAYROLL_STATUS[h.payroll_status]?.label}</span>
                  )}
                </button>
                {expanded === h.payroll_id && (
                  <div className="px-4 pb-4 space-y-2">
                    {h.transfer && (
                      <p className="text-xs text-gray-500">Rekening sumber: {h.transfer.source_account || "-"} • Ref: {h.transfer.reference_no || "-"}</p>
                    )}
                    <table className="w-full text-xs bg-slate-50 rounded-xl overflow-hidden">
                      <thead><tr className="text-gray-400 uppercase"><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Kelas & Mapel</th><th className="p-2 text-right">Menit</th><th className="p-2 text-right">Honor</th></tr></thead>
                      <tbody className="divide-y divide-white">
                        {h.sessions.map((s, i) => (
                          <tr key={i}><td className="p-2">{s.session_date} {s.start_time}</td><td className="p-2">{s.class_name} • {s.subject_name}</td><td className="p-2 text-right">{s.teaching_minutes}</td><td className="p-2 text-right font-semibold">{formatRupiah(s.subtotal)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
