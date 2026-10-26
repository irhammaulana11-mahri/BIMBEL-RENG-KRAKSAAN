import React, { useState } from "react";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import ExpenseListTable from "../../../components/admin/finance/ExpenseListTable";
import ExpenseModal from "../../../components/admin/finance/ExpenseModal";

export default function OperationalExpensePage() {
  const [monthFilter, setMonthFilter] = useState("2026-07");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // 1. DATA DUMMY PENGELUARAN OPERASIONAL (CASH OUTFLOW)
  const [mockExpenses, setMockExpenses] = useState([
    { id: 1, date: "2026-07-02", category: "Sewa & Gedung", title: "Biaya Listrik Bulanan Ruko A", amount: 450000, note: "Pembayaran via PLN Mobile" },
    { id: 2, date: "2026-07-05", category: "Pemasaran", title: "Cetak Banner & Brosur Pendaftaran", amount: 350000, note: "Percetakan Kraksaan Jaya" },
    { id: 3, date: "2026-07-10", category: "ATK & Modul", title: "Kertas HVS A4 & Token Tinta Printer", amount: 200000, note: "Pembelian rutin bulanan" },
  ]);

  // 2. DATA AGREGAT DUMMY UNTUK KEBUTUHAN HITUNG LABA-RUGI BULANAN
  const revenueParents = 1600000; 
  const expenseTutors = 1980000;   
  
  const totalOperationalExpense = mockExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalAllExpense = expenseTutors + totalOperationalExpense;
  const netProfitOrLoss = revenueParents - totalAllExpense;

  const handleAddExpense = (newExpense) => {
    setModalOpen(false);
  };

  const handleDeleteExpense = (id) => {
    if (confirm("Hapus catatan pengeluaran operasional ini dari pembukuan?")) {
      setMockExpenses(mockExpenses.filter(e => e.id !== id));
    }
  };

  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      
      {/* Header Standar (text-3xl) + Tombol Sejajar Flex */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Operational Expense & P&L</h1>
          <p className="text-base text-gray-500 mt-1">
            Pencatatan kas keluar operasional harian cabang dan rekap otomatis laporan Laba-Rugi secara real-time.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Catat Kas Keluar
        </button>
      </div>

      {/* ================= PERBAIKAN DI SINI: mb-6 dimasukkan ke dalam className ================= */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/30 mb-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-5">
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> Ringkasan Laporan Laba-Rugi (P&L)
          </h3>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-lg font-mono font-bold tracking-wide text-blue-300 border border-white/5">{monthFilter}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Total Pendapatan
            </p>
            <p className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{formatIDR(revenueParents)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Kas masuk dari wali murid resmi</p>
          </div>
          
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4 text-rose-400" /> Total Pengeluaran
            </p>
            <p className="text-3xl font-black font-mono text-rose-400 tracking-tight">{formatIDR(totalAllExpense)}</p>
            <p className="text-[11px] text-slate-400 font-medium font-mono">Gaji: {formatIDR(expenseTutors)} | Ops: {formatIDR(totalOperationalExpense)}</p>
          </div>
          
          <div className={`p-4 rounded-xl border transition-colors duration-300 ${
            netProfitOrLoss >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
          }`}>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Laba/Rugi Bersih Bulanan</p>
            <p className={`text-3xl font-black font-mono mt-1 tracking-tight ${netProfitOrLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatIDR(netProfitOrLoss)}
            </p>
            <div className="mt-2 text-xs font-bold">
              {netProfitOrLoss >= 0 ? "📈 Status Bisnis: Surplus Profit" : "⚠️ Status Bisnis: Defisit (Rugi)"}
            </div>
          </div>
        </div>
      </div>

      {/* Wadah Utama Tunggal untuk Filter & Tabel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Toolbar Pencarian & Filter Kas Operasional Terpadu */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white font-semibold text-gray-700 focus:outline-none"
            />
            
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari deskripsi pengeluaran..."
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-base bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>
        </div>

        {/* Render Tabel List Petty Cash Langsung Tanpa Wrapper Ganda */}
        <ExpenseListTable 
          data={mockExpenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))} 
          onDelete={handleDeleteExpense} 
        />

        {/* Footer Pagination Terpadu */}
        <div className="border-t border-gray-100 p-5 bg-gray-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
            <p className="text-gray-600 font-medium">
              Menampilkan <span className="text-gray-900 font-bold">1</span> - <span className="text-gray-900 font-bold">{mockExpenses.length}</span> dari <span className="text-gray-900 font-bold">{mockExpenses.length}</span> entri arus kas keluar
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Prev</button>
              <button className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">1</button>
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Next</button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Input Pengeluaran */}
      <ExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddExpense} />
    </div>
  </div>
  );
}