import React, { useEffect, useState } from "react";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck } from "lucide-react";
import ExpenseListTable from "../../../components/admin/finance/ExpenseListTable";
import ExpenseModal from "../../../components/admin/finance/ExpenseModal";
import ConfirmationModal from "../../../components/ui/confirmation/ConfirmationModal";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { getCashflow, getExpenses, createExpense, updateExpense, deleteExpense } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah, formatPeriod, currentPeriod } from "@/utils/format";

export default function OperationalExpensePage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [cashflow, setCashflow] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ keyword: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [confirm, setConfirm] = useState({ open: false });
  const { toast, showSuccess, showError, hideToast } = useToast();

  const fetchAll = async () => {
    try {
      const [cash, list] = await Promise.all([
        getCashflow(period),
        getExpenses({ period, ...filters }),
      ]);
      setCashflow(cash.data.data);
      setExpenses(list.data.data || []);
      setCategories(list.data.categories || []);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat laporan arus kas."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAll, 300);
    return () => clearTimeout(timer);
  }, [period, filters]);

  // Dipanggil ExpenseModal; error dilempar kembali agar modal menampilkannya
  const handleSubmit = async (formData) => {
    if (modal.data) await updateExpense(modal.data.id, formData);
    else await createExpense(formData);
    setModal({ open: false, data: null });
    showSuccess(modal.data ? "Pengeluaran diperbarui." : "Pengeluaran dicatat.");
    fetchAll();
  };

  const handleDelete = (item) => {
    setConfirm({
      open: true,
      title: "Hapus Pengeluaran?",
      message: `"${item.title}" (${formatRupiah(item.amount)}) akan dihapus dari pembukuan.`,
      variant: "danger",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await deleteExpense(item.id);
          showSuccess("Pengeluaran dihapus.");
          fetchAll();
        } catch (err) {
          showError(getApiErrorMessage(err, "Gagal menghapus pengeluaran."));
        }
      },
    });
  };

  const net = cashflow?.net ?? 0;
  const maxTrend = Math.max(1, ...(cashflow?.trend || []).flatMap(t => [t.income, t.out]));

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Operational Expense & Cashflow</h1>
          <p className="text-base text-gray-500 mt-1">Pencatatan kas keluar operasional dan rekap arus kas bulanan dari pembayaran siswa, honor tentor, dan biaya operasional.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white font-semibold text-gray-700" />
          <button onClick={() => setModal({ open: true, data: null })} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs">
            <Plus className="w-4 h-4" /> Catat Kas Keluar
          </button>
        </div>
      </div>

      {/* Ringkasan Arus Kas */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/30 mb-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-5">
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Ringkasan Arus Kas
          </h3>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-lg font-bold text-blue-300 border border-white/5">{formatPeriod(period)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-emerald-400" /> Kas Masuk</p>
            <p className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{formatRupiah(cashflow?.income)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Pembayaran siswa yang sudah diterima</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><ArrowDownRight className="w-4 h-4 text-rose-400" /> Kas Keluar</p>
            <p className="text-3xl font-black font-mono text-rose-400 tracking-tight">{formatRupiah(cashflow?.total_out)}</p>
            <p className="text-[11px] text-slate-400 font-medium font-mono">Honor: {formatRupiah(cashflow?.payroll)} | Ops: {formatRupiah(cashflow?.expenses)}</p>
          </div>
          <div className={`p-4 rounded-xl border ${net >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Arus Kas Bersih</p>
            <p className={`text-3xl font-black font-mono mt-1 tracking-tight ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatRupiah(net)}</p>
            <div className="mt-2 text-xs font-bold">{net >= 0 ? "Surplus" : "Defisit"}</div>
          </div>
        </div>
      </div>

      {cashflow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Piutang Siswa</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{formatRupiah(cashflow.receivables.total)}</p>
            <p className="text-xs text-gray-500 mt-1">{cashflow.receivables.count} tagihan belum lunas • {cashflow.receivables.overdue_count} lewat jatuh tempo ({formatRupiah(cashflow.receivables.overdue_total)})</p>
            {cashflow.pending_verification > 0 && <p className="text-xs text-amber-700 font-bold mt-2 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {cashflow.pending_verification} bukti bayar menunggu verifikasi</p>}
          </div>

          <div className="p-5 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Pengeluaran per Kategori</p>
            {cashflow.by_category.length === 0 ? <p className="text-sm text-gray-400">Belum ada.</p> : (
              <div className="space-y-2">
                {cashflow.by_category.map(c => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs"><span className="text-gray-600">{c.label}</span><span className="font-bold">{formatRupiah(c.total)}</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.round(c.total / cashflow.expenses * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Tren 6 Bulan</p>
            <div className="flex items-end gap-2 h-28">
              {cashflow.trend.map(t => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1" title={`${t.label}: masuk ${formatRupiah(t.income)}, keluar ${formatRupiah(t.out)}`}>
                  <div className="w-full flex items-end gap-0.5 h-24">
                    <div className="flex-1 bg-emerald-400 rounded-t" style={{ height: `${t.income / maxTrend * 100}%` }} />
                    <div className="flex-1 bg-rose-400 rounded-t" style={{ height: `${t.out / maxTrend * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-gray-500"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm" /> Masuk</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-400 rounded-sm" /> Keluar</span></div>
          </div>
        </div>
      )}

      {/* Daftar Pengeluaran Operasional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} placeholder="Cari keterangan pengeluaran..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-white" />
            </div>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
              <option value="">Semua Kategori</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <p className="text-sm font-bold text-gray-700 whitespace-nowrap">Total: {formatRupiah(expenses.reduce((sum, e) => sum + e.amount, 0))}</p>
        </div>
        <ExpenseListTable data={expenses} loading={loading} onEdit={(item) => setModal({ open: true, data: item })} onDelete={handleDelete} />
      </div>

      <ExpenseModal open={modal.open} data={modal.data} categories={categories} onClose={() => setModal({ open: false, data: null })} onSubmit={handleSubmit} />
      <ConfirmationModal open={confirm.open} title={confirm.title} message={confirm.message} variant={confirm.variant} onConfirm={confirm.onConfirm} onClose={() => setConfirm({ open: false })} />
      </div>
    </div>
  );
}
