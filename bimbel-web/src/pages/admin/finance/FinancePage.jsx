import React, { useState } from "react";
import { Wallet, Users, ShieldCheck, Scale } from "lucide-react";
import InvoiceTab from "../../../components/admin/finance/InvoiceTab";
import PaymentTab from "../../../components/admin/finance/PaymentTab";
import PayrollTab from "../../../components/admin/finance/PayrollTab";
import FeeRuleTab from "../../../components/admin/finance/FeeRuleTab";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { currentPeriod } from "@/utils/format";

const TABS = [
  { id: "invoice", label: "Tagihan Siswa", icon: Users },
  { id: "payment", label: "Verifikasi Pembayaran", icon: ShieldCheck },
  { id: "payroll", label: "Honor Tentor", icon: Wallet },
  { id: "rules", label: "Aturan Tarif", icon: Scale },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("invoice");
  const [period, setPeriod] = useState(currentPeriod());
  const [pendingCount, setPendingCount] = useState(0);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const notify = (message, type = "success") => (type === "error" ? showError(message) : showSuccess(message));

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Keuangan</h1>
          <p className="text-gray-500">Kelola tagihan bulanan siswa, verifikasi pembayaran orang tua, dan honor mengajar tentor</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/30">

            {/* Switcher Tab Keuangan */}
            <div className="flex flex-wrap bg-gray-200 p-1 rounded-xl shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "payment" && pendingCount > 0 && (
                    <span className="ml-1 px-1.5 rounded-full bg-rose-500 text-white text-[10px]">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter Periode Bulan */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Periode</span>
              <input
                type="month"
                value={period}
                onChange={(e) => e.target.value && setPeriod(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-medium text-gray-700"
              />
            </div>
          </div>

          <div className="p-6">
            {activeTab === "invoice" && <InvoiceTab period={period} onPeriodChange={setPeriod} onNotify={notify} />}
            {/* Tetap dirender agar badge jumlah verifikasi selalu terbarui */}
            <div hidden={activeTab !== "payment"}>
              <PaymentTab period={period} onNotify={notify} onPendingChange={setPendingCount} />
            </div>
            {activeTab === "payroll" && <PayrollTab period={period} onNotify={notify} />}
            {activeTab === "rules" && <FeeRuleTab onNotify={notify} />}
          </div>
        </div>
      </div>
    </div>
  );
}
