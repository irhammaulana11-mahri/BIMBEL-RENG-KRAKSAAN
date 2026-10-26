import React, { useState } from "react";
import { 
  GraduationCap, 
  CalendarDays, 
  CreditCard, 
  Megaphone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  User
} from "lucide-react";

// Import komponen baku PremiumStatCard
import PremiumStatCard from "../../components/ui/StatCard";

export default function ParentDashboardPage() {
  // ================= DATA DUMMY (RESPON API SIMULASI) =================
  const [dashboardData] = useState({
    // 1. DATA RINGKASAN
    summary: {
      active_students_count: 2,
      attendance_percentage: 95,
      unpaid_invoices_count: 1,
      total_unpaid_amount: 350000,
    },
    
    // 2. DATA JADWAL HARI INI
    today_schedules: [
      {
        id: 1,
        student_name: "Agus Santoso",
        education_level: "12 SMA",
        subject: "Matematika IPA",
        tentor_name: "Kak Dimas, S.Si.",
        time: "15:30 - 17:00",
        room: "Ruang A-02",
        status: "UPCOMING"
      },
      {
        id: 2,
        student_name: "Siti Rahma",
        education_level: "9 SMP",
        subject: "Bahasa Inggris",
        tentor_name: "Miss Sarah, M.Pd.",
        time: "18:30 - 20:00",
        room: "Ruang B-01",
        status: "UPCOMING"
      }
    ],

    // 3. DATA TAGIHAN AKTIF
    active_invoices: [
      {
        id: "INV/2026/07/0012",
        title: "SPP Bimbingan Juli 2026 - Agus Santoso",
        amount: 350000,
        due_date: "2026-07-25",
        status: "UNPAID"
      }
    ],

    // 4. DATA PENGUMUMAN
    announcements: [
      {
        id: 1,
        title: "Jadwal Try Out UTBK-SNBT Gelombang II",
        date: "20 Jul 2026",
        category: "AKADEMIK",
        content: "Pelaksanaan Try Out Mandiri berbasis CBT akan dilaksanakan serentak pada hari Sabtu mendatang. Mohon pastikan moda belajar anak dipersiapkan."
      },
      {
        id: 2,
        title: "Libur Operasional Hari Raya / Libur Nasional",
        date: "15 Jul 2026",
        category: "OPERASIONAL",
        content: "Seluruh kegiatan KBM di Bimbel Reng Kraksaan diliburkan sementara dan akan dimulai kembali sesuai kalender akademik."
      }
    ]
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Beranda Wali Murid</h1>
          <p className="text-base text-gray-500 mt-1">Selamat datang kembali! Pantau ringkasan aktivitas dan administrasi belajar anak Anda.</p>
        </div>
      </div>

      {/* ================= 1. KARTU RINGKASAN (MENGGUNAKAN PREMIUM STAT CARD BAKU) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Card 1: Anak Didik */}
        <PremiumStatCard
          title="Anak Didik"
          value={`${dashboardData.summary.active_students_count} Siswa`}
          desc="Terdaftar Bimbingan"
          icon={GraduationCap}
          colorClass="bg-blue-50 text-blue-600"
        />

        {/* Card 2: Kehadiran */}
        <PremiumStatCard
          title="Kehadiran"
          value={`${dashboardData.summary.attendance_percentage}%`}
          desc="Persentase Kehadiran Bulan Ini"
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600"
        />

        {/* Card 3: Tagihan Aktif */}
        <PremiumStatCard
          title="Tagihan Aktif"
          value={`${dashboardData.summary.unpaid_invoices_count} Invoice`}
          desc="Menunggu Pembayaran"
          icon={CreditCard}
          colorClass="bg-amber-50 text-amber-600"
        />

        {/* Card 4: Tunggakan SPP */}
        <PremiumStatCard
          title="Tunggakan SPP"
          value={`Rp ${(dashboardData.summary.total_unpaid_amount / 1000).toLocaleString("id-ID")}rb`}
          desc="Jatuh Tempo Bulan Ini"
          icon={AlertCircle}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* GRID UTAMA KONTEN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* KIRI (2 KOLOM): JADWAL & TAGIHAN */}
        <div className="lg:col-span-2 space-y-6">

          {/* ================= 2. JADWAL HARI INI ================= */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-950 tracking-tight">Jadwal Belajar Hari Ini</h2>
                  <p className="text-xs text-gray-400 font-medium">Sesi tatap muka kelas bimbingan aktif</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-gray-500 bg-slate-100 px-3 py-1 rounded-lg">
                {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* List Item Jadwal Hari Ini */}
            <div className="space-y-3">
              {dashboardData.today_schedules.length === 0 ? (
                <div className="text-center py-6 text-gray-400 italic text-sm">
                  Tidak ada agenda kelas bimbingan untuk hari ini.
                </div>
              ) : (
                dashboardData.today_schedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md uppercase">
                          {schedule.education_level}
                        </span>
                        <h4 className="font-bold text-gray-950 text-base">{schedule.subject}</h4>
                      </div>
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <User size={14} className="text-gray-400" />
                        Siswa: <span className="text-gray-900 font-bold">{schedule.student_name}</span> &bull; Pengajar: {schedule.tentor_name}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-0 pt-2 sm:pt-0 border-gray-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        <Clock size={14} />
                        {schedule.time}
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 mt-1">{schedule.room}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= 3. TAGIHAN AKTIF ================= */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-950 tracking-tight">Tagihan Aktif</h2>
                  <p className="text-xs text-gray-400 font-medium">Daftar administrasi iuran berjalan yang memerlukan pembayaran</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {dashboardData.active_invoices.length === 0 ? (
                <div className="text-center py-6 text-emerald-600 font-semibold text-sm">
                  ✨ Semua tagihan iuran anak Anda sudah lunas!
                </div>
              ) : (
                dashboardData.active_invoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-gray-400">{inv.id}</span>
                      <h4 className="font-bold text-gray-950 text-sm">{inv.title}</h4>
                      <p className="text-xs text-amber-700 font-medium">
                        Jatuh Tempo: <span className="font-bold font-mono">{new Date(inv.due_date).toLocaleDateString("id-ID")}</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-0 pt-2 sm:pt-0 border-amber-100">
                      <span className="text-lg font-black text-gray-950 font-mono">
                        Rp {inv.amount.toLocaleString("id-ID")}
                      </span>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1">
                        Bayar Sekarang <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* KANAN (1 KOLOM): PENGUMUMAN */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* ================= 4. PENGUMUMAN ================= */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Megaphone size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-950 tracking-tight">Pengumuman</h2>
                <p className="text-xs text-gray-400 font-medium">Informasi resmi dari pengelola bimbel</p>
              </div>
            </div>

            <div className="space-y-4">
              {dashboardData.announcements.map((item) => (
                <div key={item.id} className="space-y-1.5 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-md uppercase">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold font-mono">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-gray-950 text-sm leading-snug">{item.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
  );
}