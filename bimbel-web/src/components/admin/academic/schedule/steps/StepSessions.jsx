import React, { useEffect } from "react";
import { PlayCircle, Pencil } from "lucide-react";

export default function StepSessions({ formData, setFormData }) {
  
  // Logic Engine Pembuat Tanggal KBM Otomatis
  const generateSessions = () => {
    if (!formData.start_date) return;

    let allSessions = [];
    
    formData.patterns.forEach((pat) => {
      let currentDate = new Date(formData.start_date);
      const targetDay = parseInt(pat.day_of_week);

      // 1. Cari tanggal pertama yang cocok dengan hari (0=Minggu, 1=Senin, dst) mulai dari start_date
      while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 2. Lakukan looping penambahan +7 Hari (1 Minggu) sebanyak target KBM mapel tersebut
      for (let i = 1; i <= pat.meeting_target; i++) {
        allSessions.push({
          id: `${pat.subject_id}_${i}`, // Temporary ID untuk react key
          subject_id: pat.subject_id,
          subject_name: pat.subject_name,
          tentor_id: pat.tentor_id,
          tentor_name: pat.tentor_name,
          meeting_no: i,
          session_date: currentDate.toISOString().split("T")[0],
          start_time: pat.start_time,
          end_time: pat.end_time,
        });
        
        // Loncat ke minggu depan
        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    // 3. Urutkan secara kronologis (Tanggal & Jam)
    allSessions.sort((a, b) => {
      const dateA = new Date(`${a.session_date}T${a.start_time}`);
      const dateB = new Date(`${b.session_date}T${b.start_time}`);
      return dateA - dateB;
    });

    setFormData({ ...formData, generated_sessions: allSessions });
  };

  // Handler jika admin ingin mengganti manual tanggal spesifik (misal jika tanggal merah)
  const handleEditDate = (id, newDate) => {
    const updated = formData.generated_sessions.map((s) => 
      s.id === id ? { ...s, session_date: newDate } : s
    );
    setFormData({ ...formData, generated_sessions: updated });
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <div>
          <h4 className="text-sm font-black text-emerald-900">Review Schedule Session</h4>
          <p className="text-xs text-emerald-700 mt-0.5 font-medium">Sistem akan men-generate {formData.patterns.reduce((a, b) => a + (b.meeting_target || 0), 0)} sesi KBM berdasarkan pola hari yang ditetapkan.</p>
        </div>
        <button 
          onClick={generateSessions}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <PlayCircle size={16} /> Generate Preview
        </button>
      </div>

      {formData.generated_sessions.length > 0 && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl max-h-96 overflow-y-auto shadow-sm">
          <table className="ui-table w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-gray-200 shadow-sm z-10">
              <tr>
                <th className="p-3 font-bold text-gray-500 uppercase w-20">Meeting</th>
                <th className="p-3 font-bold text-gray-500 uppercase">Tanggal</th>
                <th className="p-3 font-bold text-gray-500 uppercase">Waktu</th>
                <th className="p-3 font-bold text-gray-500 uppercase">Mapel</th>
                <th className="p-3 font-bold text-gray-500 uppercase">Tentor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formData.generated_sessions.map((ses) => (
                <tr key={ses.id} className="hover:bg-slate-50">
                  <td className="p-3 font-black text-blue-600 text-center bg-blue-50/30">M-{ses.meeting_no}</td>
                  <td className="p-3">
                    {/* Admin Bisa Mengubah Tanggal Secara Live */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="date"
                        value={ses.session_date}
                        onChange={(e) => handleEditDate(ses.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-bold bg-white focus:border-blue-500"
                      />
                      <Pencil size={12} className="text-gray-400" />
                    </div>
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-600">{ses.start_time} - {ses.end_time}</td>
                  <td className="p-3 font-bold text-gray-900">{ses.subject_name}</td>
                  <td className="p-3 font-semibold text-gray-700">{ses.tentor_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}