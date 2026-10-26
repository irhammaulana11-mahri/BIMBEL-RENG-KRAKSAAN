import React, { useState } from "react";
import { Wallet, Users, Landmark, FileText, Send, CheckCircle2, Search } from "lucide-react";
import ParentFinanceTable from "../../../components/admin/finance/ParentFinanceTable";
import TutorFinanceTable from "../../../components/admin/finance/TutorFinanceTable";

// ================= BARIS IMPORT YANG KURANG (PENYEBAB BLANK) =================
import VerificationModal from "../../../components/admin/finance/VerificationModal";
import TutorPaymentModal from "../../../components/admin/finance/TutorPaymentModal";

const PremiumStatCard = ({ title, value, desc, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{desc}</p>
    </div>
    <div className={`p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function FinancePage() {
  // 1. STATE CONFIGURATION
  const [activeTab, setActiveTab] = useState("parent"); 
  const [monthFilter, setMonthFilter] = useState("2026-07"); 
  const [search, setSearch] = useState("");
  
  // State Tambahan untuk Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedParentRow, setSelectedParentRow] = useState(null);

  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [selectedTutorRow, setSelectedTutorRow] = useState(null);

  // 2. DATA DUMMY ORANG TUA
  const [mockParentFinance, setMockParentFinance] = useState([
    {
      id: 1,
      parent_name: "Analuam Mahri",
      student_name: "Rian Mahri",
      package_name: "Intensif SMA 12 (Rumah)",
      base_price: 1200000,
      meetings_allotted: 12,
      actual_attendance: 10, 
      calculated_bill: (1200000 / 12) * 10, 
      status: "unpaid",
      phone: "081913311558",
      reject_reason: ""
    },
    {
      id: 2,
      parent_name: "Desi",
      student_name: "Siti Badriah",
      package_name: "Reguler SMP 9 (Bimbel)",
      base_price: 600000,
      meetings_allotted: 8,
      actual_attendance: 8,
      calculated_bill: (600000 / 8) * 8, 
      status: "paid",
      phone: "08234567890",
      reject_reason: ""
    }
  ]);

  // 3. DATA DUMMY TENTOR
  const [mockTutorFinance, setMockTutorFinance] = useState([
    {
      id: 201,
      tutor_name: "Budi Santoso, S.Pd.",
      specialty: "Matematika",
      rate_per_meeting: 75000, 
      total_teaching: 16, 
      calculated_salary: 75000 * 16, 
      status: "unpaid"
    },
    {
      id: 202,
      tutor_name: "Dewi Lestari, M.Pd.",
      specialty: "Sosiologi",
      rate_per_meeting: 65000,
      total_teaching: 12,
      calculated_salary: 65000 * 12, 
      status: "paid",
      source_bank: "BCA - Rek Utama Bimbel",
      transfer_reference: "REF819238129",
      transfer_date: "2026-07-15"
    }
  ]);

  // Handler Aksi WA Invoice PDF
  const handleSendInvoice = (row) => {
    alert(`Mengirim PDF Invoice Tagihan Bulan ${monthFilter} ke Orang Tua: ${row.parent_name} via WhatsApp (${row.phone})`);
  };

  // Handler Konfirmasi Bukti Bayar Orang Tua (Approval / Reject)
  const handleConfirmParentPayment = (id, newStatus, reason) => {
    setMockParentFinance(mockParentFinance.map(p => 
      p.id === id ? { ...p, status: newStatus === "approved" ? "paid" : "rejected", reject_reason: reason } : p
    ));
    setVerifyModalOpen(false);
  };

  // Handler Eksekusi Pembayaran Gaji Tentor
  const handleExecuteTutorPayroll = (id, transferInfo) => {
    setMockTutorFinance(mockTutorFinance.map(t => 
      t.id === id ? { ...t, status: "paid", ...transferInfo } : t
    ));
    setTutorModalOpen(false);
  };

  // Logic Filter client-side
  const filteredParents = mockParentFinance.filter(p => 
    p.parent_name.toLowerCase().includes(search.toLowerCase()) || p.student_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTutors = mockTutorFinance.filter(t => 
    t.tutor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Finance Management</h1>
          <p className="text-gray-500">Kelola invoice tagihan bulanan wali murid dan payroll honor mengajar tentor</p>
        </div>

        {/* Ringkasan Dashboard Ringkas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PremiumStatCard title="Estimasi Piutang Orang Tua" value="1.600.000" desc="Total tagihan terbit bulan ini" icon={Users} colorClass="bg-slate-50 text-slate-600"/>
          <PremiumStatCard title="Rencana Pengeluaran Gaji" value="1.980.000" desc="Total beban honor tentor aktif" icon={Users} colorClass="bg-slate-50 text-slate-600"/>
          <PremiumStatCard title="Kas Masuk Terbayar" value="600.000" desc="Berdasarkan konfirmasi kwitansi" icon={Users} colorClass="bg-slate-50 text-slate-600"/>
        </div>

        {/* Kontrol Navigasi Utama Tab & Filter Periode */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/30">
            
            {/* SISI KIRI: Switcher Tab Keuangan */}
            <div className="flex bg-gray-200 p-1 rounded-xl shrink-0">
              <button
                onClick={() => { setActiveTab("parent"); setSearch(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "parent" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                Tagihan Orang Tua
              </button>
              <button
                onClick={() => { setActiveTab("tutor"); setSearch(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "tutor" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Payroll / Gaji Tentor
              </button>
            </div>

            {/* SISI KANAN: Pencarian & Filter Periode Bulan */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-medium text-gray-700"
              />
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={activeTab === 'parent' ? "Cari orang tua / siswa..." : "Cari tentor..."}
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* AREA DATA RENDERING */}
          <div className="p-6">
            {activeTab === "parent" ? (
              <ParentFinanceTable 
                data={filteredParents} 
                onSendInvoice={handleSendInvoice} 
                onOpenVerify={(row) => { 
                  setSelectedParentRow(row); 
                  setVerifyModalOpen(true); 
                }} 
              />
            ) : (
              <TutorFinanceTable 
                data={filteredTutors} 
                onOpenPayModal={(row) => { 
                  setSelectedTutorRow(row); 
                  setTutorModalOpen(true); 
                }} 
              />
            )}
          </div>
        </div>

      </div>

      {/* POSISI YANG BENAR: Modal diletakkan di root tingkat bawah komponen */}
      <VerificationModal 
        open={verifyModalOpen} 
        onClose={() => setVerifyModalOpen(false)} 
        data={selectedParentRow} 
        onConfirm={handleConfirmParentPayment} 
      />

      <TutorPaymentModal 
        open={tutorModalOpen} 
        onClose={() => setTutorModalOpen(false)} 
        data={selectedTutorRow} 
        onSubmit={handleExecuteTutorPayroll} 
      />
    </div>
  );
}