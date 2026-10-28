import React, { useEffect, useState } from "react";
import { Search, Paperclip } from "lucide-react";
import VerificationModal from "./VerificationModal";
import { getPayments, PAYMENT_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";
import TablePagination from "@/components/ui/table/TablePagination";

export default function PaymentTab({ period, onNotify, onPendingChange }) {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selected, setSelected] = useState(null);

  const fetchPayments = async () => {
    try {
      // Antrian verifikasi tidak dibatasi periode
      const res = await getPayments({ status, keyword, period: status === "PENDING" ? "" : period, page, per_page: perPage });
      setPayments(res.data.data || []);
      setMeta(res.data.meta || { current_page: 1, last_page: 1 });
      onPendingChange?.(res.data.summary?.pending ?? 0);
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal memuat pembayaran."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timer);
  }, [status, keyword, period, page, perPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {[["PENDING", "Menunggu Verifikasi"], ["CONFIRMED", "Diterima"], ["REJECTED", "Ditolak"], ["", "Semua"]].map(([value, label]) => (
            <button key={label} onClick={() => { setStatus(value); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === value ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>{label}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} placeholder="No. bayar / referensi / siswa..." className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm" />
        </div>
        {status !== "PENDING" && <span className="text-xs text-gray-400">Periode tanggal bayar: {period}</span>}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="ui-table w-full text-left text-sm min-w-[760px]">
          <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            <tr><th className="p-4">Pembayaran</th><th className="p-4">Siswa</th><th className="p-4">Metode</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Memuat pembayaran...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">{status === "PENDING" ? "Tidak ada bukti pembayaran yang menunggu verifikasi." : "Belum ada pembayaran."}</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{p.payment_no}</p>
                  <p className="text-xs text-gray-400">{p.payment_date} • {p.invoices?.map(i => i.invoice_no).join(", ")}</p>
                </td>
                <td className="p-4 font-semibold text-gray-800">{p.student_name}</td>
                <td className="p-4 text-xs text-gray-600">
                  {p.payment_method === "CASH" ? "Tunai (dicatat Admin)" : `Transfer ${p.payment_channel || ""}`}
                  {p.has_proof && <Paperclip className="inline w-3.5 h-3.5 ml-1 text-gray-400" />}
                </td>
                <td className="p-4 text-right font-bold">{formatRupiah(p.total_amount)}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${PAYMENT_STATUS[p.status]?.className}`}>{PAYMENT_STATUS[p.status]?.label}</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => setSelected(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${p.status === "PENDING" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {p.status === "PENDING" ? "Verifikasi" : "Detail"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        pagination={{ page: meta.current_page || 1, lastPage: meta.last_page || 1, perPage, total: meta.total || 0, from: meta.from || 0, to: meta.to || 0 }}
        onPageChange={(target, newPerPage) => { if (newPerPage) setPerPage(newPerPage); setPage(target); }}
        label="data"
      />

      <VerificationModal
        open={!!selected}
        payment={selected}
        onClose={() => setSelected(null)}
        onDone={(message) => { setSelected(null); onNotify(message); fetchPayments(); }}
      />
    </div>
  );
}
