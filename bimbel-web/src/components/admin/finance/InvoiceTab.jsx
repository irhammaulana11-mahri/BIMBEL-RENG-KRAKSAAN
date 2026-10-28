import React, { useEffect, useState } from "react";
import { Search, CalendarPlus, FilePlus, AlertTriangle, Hourglass } from "lucide-react";
import InvoiceGenerateModal from "./InvoiceGenerateModal";
import InvoiceFormModal from "./InvoiceFormModal";
import InvoiceDetailModal from "./InvoiceDetailModal";
import RecordPaymentModal from "./RecordPaymentModal";
import { getInvoices, INVOICE_STATUS } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod } from "@/utils/format";
import TablePagination from "@/components/ui/table/TablePagination";

export default function InvoiceTab({ period, onPeriodChange, onNotify }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", keyword: "", overdue: false });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [modal, setModal] = useState(null); // generate | manual
  const [detailId, setDetailId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      const res = await getInvoices({
        period: filters.overdue ? "" : period,
        status: filters.status,
        keyword: filters.keyword,
        overdue: filters.overdue ? 1 : "",
        page,
        per_page: perPage,
      });
      setInvoices(res.data.data || []);
      setSummary(res.data.summary || {});
      setMeta(res.data.meta || { current_page: 1, last_page: 1 });
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal memuat tagihan."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [period, filters, page, perPage]);

  const handleDone = (message, newPeriod) => {
    setModal(null);
    onNotify(message);
    if (newPeriod && newPeriod !== period) onPeriodChange(newPeriod);
    else fetchInvoices();
  };

  const collectedPercent = summary.total_amount > 0 ? Math.round(summary.paid_amount / summary.total_amount * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Tagihan {filters.overdue ? "Jatuh Tempo" : formatPeriod(period)}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatRupiah(summary.total_amount)}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.count || 0} tagihan • {summary.paid_count || 0} lunas</p>
        </div>
        <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50">
          <p className="text-xs font-bold text-emerald-700 uppercase">Sudah Terbayar</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{formatRupiah(summary.paid_amount)}</p>
          <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${collectedPercent}%` }} /></div>
        </div>
        <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50">
          <p className="text-xs font-bold text-rose-700 uppercase">Sisa Piutang</p>
          <p className="text-2xl font-black text-rose-900 mt-1">{formatRupiah(summary.remaining_amount)}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={filters.keyword} onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }} placeholder="No. tagihan / siswa / orang tua..." className="w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm" />
          </div>
          <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
            <option value="">Semua Status</option>
            <option value="OPEN">Belum Lunas</option>
            {Object.entries(INVOICE_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 px-2 cursor-pointer">
            <input type="checkbox" checked={filters.overdue} onChange={e => { setFilters({ ...filters, overdue: e.target.checked }); setPage(1); }} className="rounded" />
            Lewat jatuh tempo (semua periode)
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("manual")} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"><FilePlus className="w-4 h-4" /> Tagihan Manual</button>
          <button onClick={() => setModal("generate")} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5"><CalendarPlus className="w-4 h-4" /> Generate Bulanan</button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="ui-table w-full text-left text-sm min-w-[820px]">
          <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            <tr><th className="p-4">Tagihan</th><th className="p-4">Siswa / Wali</th><th className="p-4">Kelas</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Sisa</th><th className="p-4 text-center">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Memuat tagihan...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada tagihan. Gunakan <strong>Generate Bulanan</strong> untuk menagih siswa periode ini.</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} onClick={() => setDetailId(inv.id)} className="hover:bg-blue-50/40 cursor-pointer">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{inv.invoice_no}</p>
                  <p className="text-xs text-gray-400">Jatuh tempo {inv.due_date}</p>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-gray-800">{inv.student_name}</p>
                  <p className="text-xs text-gray-400">{inv.parent_names?.join(", ") || "-"}</p>
                </td>
                <td className="p-4 text-xs text-gray-600">{inv.class_name}<span className="block text-gray-400">{inv.package_name}</span></td>
                <td className="p-4 text-right font-semibold">{formatRupiah(inv.total_amount)}</td>
                <td className="p-4 text-right font-bold text-rose-700">{inv.remaining_amount > 0 ? formatRupiah(inv.remaining_amount) : "-"}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${INVOICE_STATUS[inv.status]?.className}`}>{INVOICE_STATUS[inv.status]?.label}</span>
                  {inv.is_overdue && <AlertTriangle className="inline w-4 h-4 text-rose-500 ml-1" title="Lewat jatuh tempo" />}
                  {inv.has_pending_payment && <Hourglass className="inline w-4 h-4 text-amber-500 ml-1" title="Ada bukti bayar menunggu verifikasi" />}
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

      <InvoiceGenerateModal open={modal === "generate"} period={period} onClose={() => setModal(null)} onDone={handleDone} />
      <InvoiceFormModal open={modal === "manual"} onClose={() => setModal(null)} onDone={handleDone} />
      <InvoiceDetailModal
        open={!!detailId}
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
        onRecordPayment={(inv) => setPayingInvoice(inv)}
        onChanged={(message) => { onNotify(message); fetchInvoices(); }}
      />
      <RecordPaymentModal
        open={!!payingInvoice}
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onDone={(message) => { setPayingInvoice(null); setDetailId(null); onNotify(message); fetchInvoices(); }}
      />
    </div>
  );
}
