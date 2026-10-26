import React, { useEffect, useState } from "react";
import { CreditCard, Wallet, Calendar, ArrowUpRight, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";


export default function FinancePage() {
  const [summary, setSummary] = useState({ unpaid_amount: 0, total_paid: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFinanceSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get("/parent/finance-summary"); // Mengambil ikhtisar neraca pembayaran SPP orang tua
        setSummary(res.data?.summary || { unpaid_amount: 0, total_paid: 0 });
        setHistory(res.data?.history || []);
      } catch (err) {
        console.error("Gagal memuat rangkuman keuangan:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFinanceSummary();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Ikhtisar Transaksi & Keuangan</h1>
        <p className="text-base text-gray-500 mt-1">Pantau rangkuman akumulasi biaya bimbingan belajar dan seluruh status kelayakan kas SPP anak didik.</p>
      </div>

      {/* Row Kartu Statistik Ringkasan Dana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tagihan Tertunda (Unpaid)</p>
            <h3 className="text-2xl font-black text-amber-600 font-mono">
              Rp {Number(summary.unpaid_amount).toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Wallet size={24} className="stroke-[1.5]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Dana Terbayar (Paid)</p>
            <h3 className="text-2xl font-black text-emerald-600 font-mono">
              Rp {Number(summary.total_paid).toLocaleString("id-ID")}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} className="stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* Tabel Log Transaksi Terkini */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4.5 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-950 uppercase tracking-wider">Log Riwayat Pembayaran Pembukuan</h2>
        </div>
        
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                <th className="px-6 py-4">Metode Transfer</th>
                <th className="px-6 py-4">Nominal Bayar</th>
                <th className="px-6 py-4 text-center">Tanggal Transaksi</th>
                <th className="px-6 py-4 text-center w-36">Status Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
              {loading && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">Memuat log kas pembayaran...</td>
                </tr>
              )}
              
              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 italic">Belum ada rekapan setoran dana terkonfirmasi.</td>
                </tr>
              )}

              {history.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    {log.payment_method || "Transfer Bank / Manual"}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-emerald-600">
                    + Rp {Number(log.amount_paid).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-3.5 text-center font-mono font-bold text-gray-400">
                    {new Date(log.payment_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                      <ArrowUpRight size={12} /> Terarsip
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}