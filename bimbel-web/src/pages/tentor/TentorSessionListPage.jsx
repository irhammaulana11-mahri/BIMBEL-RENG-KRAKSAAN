import React, { useState } from "react";
import { PlayCircle, CheckCircle2, Clock, Users, BookOpen, Plus, HelpCircle, FileText, Check } from "lucide-react";

export default function TentorSessionListPage() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState("activities");

  // Dummy list sesi pembelajaran tentor
  const sessions = [
    { id: "s1", time: "07:00 - 09:00", subject: "Ilmu Pengetahuan Sosial", className: "ONLINE-SMP-8A", students: 10, status: "PREPARING" },
    { id: "s2", time: "10:30 - 12:30", subject: "Sejarah Indonesia", className: "Kelas 12 IPS Utama", students: 15, status: "SCHEDULED" },
  ];

  // Jika detail sesi dibuka
  if (selectedSession) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <button onClick={() => setSelectedSession(null)} className="text-xs font-bold text-indigo-600 hover:underline">← Kembali ke Daftar Sesi</button>
        
        {/* HEADER SESI */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{selectedSession.className}</span>
            <h1 className="text-xl font-black text-gray-900 mt-1">{selectedSession.subject}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{selectedSession.time} WIB • Status: <strong className="text-indigo-600">{selectedSession.status}</strong></p>
          </div>
          <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer">
            <PlayCircle size={16} /> Mulai Sesi KBM
          </button>
        </div>

        {/* TABS INTERNAL SESI */}
        <div className="flex border-b border-gray-200">
          {['overview', 'activities', 'students', 'attendance'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-xs font-black uppercase border-b-2 transition-colors cursor-pointer ${activeTab === tab ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' : 'border-transparent text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* KONTEN TAB: ACTIVITIES (Tempat Materi, Diskusi, Quiz/Exam bekerja) */}
        {activeTab === 'activities' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Session Activities (Materi & Evaluasi)</h3>
                <p className="text-xs text-gray-500">Rangkaian aktivitas pembelajaran yang akan dilaksanakan dalam sesi ini.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Plus size={14} /> Tambah Aktivitas
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={18}/></div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600">MATERIAL</span>
                    <h4 className="text-sm font-bold text-gray-900">Bab 2 — Pengertian Mobilitas Sosial</h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded">COMPLETED</span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><FileText size={18}/></div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-600">ASSESSMENT (EXAM)</span>
                    <h4 className="text-sm font-bold text-gray-900">Quiz Mobilitas Sosial (10 Soal)</h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded">READY</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Sesi Pembelajaran</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola pelaksanaan kelas, materi, dan evaluasi harian Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-indigo-600">{s.time} WIB</span>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded">{s.status}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{s.className}</span>
              <h3 className="text-base font-black text-gray-900 mt-0.5">{s.subject}</h3>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Users size={14}/> {s.students} Siswa Terdaftar</span>
              <button onClick={() => setSelectedSession(s)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer">
                Buka Sesi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}