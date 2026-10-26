import React, { useState } from "react";
import { BookOpen, CheckCircle2, Clock, Globe, HelpCircle, MapPin, PlayCircle, Plus, Users, FileText, Check } from "lucide-react";

export default function TentorSessionPage() {
  const [activeTab, setActiveTab] = useState("activities"); // overview, activities, students, attendance
  const [sessionStatus, setSessionStatus] = useState("PREPARING"); // SCHEDULED, PREPARING, IN_PROGRESS, COMPLETED

  // Data Dummy Aktivitas Sesi (session_activities)
  const [activities, setActivities] = useState([
    { id: "act1", type: "MATERIAL", title: "Bab 2 — Pengertian Mobilitas Sosial", status: "COMPLETED" },
    { id: "act2", type: "DISCUSSION", title: "Studi Kasus Perubahan Stratifikasi", status: "IN_PROGRESS" },
    { id: "act3", type: "ASSESSMENT", title: "Quiz Mobilitas Sosial (10 Soal)", status: "READY" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: "MATERIAL", title: "" });

  const handleAddActivity = (e) => {
    e.preventDefault();
    if(!newActivity.title) return;
    setActivities([...activities, { id: Date.now().toString(), type: newActivity.type, title: newActivity.title, status: "READY" }]);
    setNewActivity({ type: "MATERIAL", title: "" });
    setShowAddModal(false);
    if(sessionStatus === "SCHEDULED") setSessionStatus("PREPARING");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 🟢 HEADER KELAS & KONTROL SESI */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">ONLINE-SMP-8A</span>
            <span className="text-xs font-bold text-gray-400">• Senin, 20 Juli 2026</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">Ilmu Pengetahuan Sosial</h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Waktu: 07:00 – 09:00 WIB | Tentor: Dewi Wulan</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Status Sesi</p>
            <p className="text-xs font-black text-indigo-600">{sessionStatus}</p>
          </div>

          {sessionStatus !== 'IN_PROGRESS' && sessionStatus !== 'COMPLETED' ? (
            <button 
              onClick={() => setSessionStatus("IN_PROGRESS")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle size={16} /> Mulai Sesi
            </button>
          ) : sessionStatus === 'IN_PROGRESS' ? (
            <button 
              onClick={() => setSessionStatus("COMPLETED")}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
            >
              Selesaikan Sesi
            </button>
          ) : (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">Sesi Selesai</span>
          )}
        </div>
      </div>

      {/* 🟢 NAVIGASI TAB SESI */}
      <div className="flex border-b border-gray-200">
        {['overview', 'activities', 'students', 'attendance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🟢 KONTEN TAB: ACTIVITIES (Core session_activities) */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Rencana Pembelajaran (Session Activities)</h3>
              <p className="text-xs text-gray-500">Tentukan urutan materi, diskusi, atau kuis yang akan diajarkan hari ini.</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} /> Tambah Aktivitas
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activities.map((act, index) => (
              <div key={act.id} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{act.type}</span>
                    <h4 className="text-sm font-black text-gray-900">{act.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                    act.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    act.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KONTEN TAB LAINNYA DIHDIRKAN RINGKAS */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div><p className="text-gray-400 uppercase">Kelas:</p><p className="text-sm font-bold text-gray-900">ONLINE-SMP-8A</p></div>
            <div><p className="text-gray-400 uppercase">Mata Pelajaran:</p><p className="text-sm font-bold text-gray-900">Ilmu Pengetahuan Sosial</p></div>
            <div><p className="text-gray-400 uppercase">Ruangan / URL:</p><p className="text-sm font-bold text-blue-600 underline">Gabung Google Meet</p></div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center py-10 text-gray-400 font-bold">
          Daftar siswa yang terikat pada kelas ini akan tampil di sini.
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center py-10 text-gray-400 font-bold">
          Modul Input Absensi Siswa per Sesi.
        </div>
      )}

      {/* 🟢 MODAL TAMBAH AKTIVITAS */}
      {showAddModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase">Tambah Aktivitas Sesi</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Jenis Aktivitas</label>
                <select 
                  value={newActivity.type} 
                  onChange={e => setNewActivity({...newActivity, type: e.target.value})}
                  className="w-full mt-1 border border-gray-300 rounded-xl p-2.5 text-xs font-bold outline-none bg-white"
                >
                  <option value="MATERIAL">📚 Materi (Curriculum)</option>
                  <option value="DISCUSSION">💬 Discussion / Studi Kasus</option>
                  <option value="ASSESSMENT">📝 Assessment / Quiz & Exam</option>
                  <option value="REVIEW">📖 Review</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Judul / Topik Pembelajaran</label>
                <input 
                  type="text" 
                  required
                  placeholder="Cth: Bab 2 - Bentuk Mobilitas Sosial" 
                  value={newActivity.title}
                  onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full mt-1 border border-gray-300 rounded-xl p-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Batal</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}