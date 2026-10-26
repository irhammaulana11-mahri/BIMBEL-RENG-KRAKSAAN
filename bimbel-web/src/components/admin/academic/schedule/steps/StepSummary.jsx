import React, { useMemo } from "react";
import { CheckCircle2, MapPin, CalendarDays, BookOpen, Layers, Globe } from "lucide-react";
import { DAYS_LIST, DAY_MAP } from "@/components/constants/schedule.constants";

export default function StepSummary({ formData, classList }) {
  const selectedClass = useMemo(() => {
    return classList.find((c) => c.id === formData.class_id);
  }, [classList, formData.class_id]);

  const totalSessions = formData.generated_sessions?.length || 0;
  const classType = formData.class_type?.toUpperCase() || "REGULER";

  // Fungsi helper untuk mendapatkan nama hari
  const getDayName = (dayValue) => {
    if (!dayValue && dayValue !== 0) return "-";
    return DAY_MAP[parseInt(dayValue)] || DAYS_LIST[parseInt(dayValue) - 1] || dayValue;
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4">
      
      {/* KARTU SUKSES PREVIEW */}
      <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight">Siap Melakukan Generate!</h3>
          <p className="text-blue-100 text-xs mt-1 font-medium">
            Sistem telah merancang <strong className="font-bold text-white text-sm mx-1">{totalSessions}</strong> sesi KBM siap pakai.
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Layers size={24} className="text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DETAIL KELAS & LOKASI */}
        <div className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            Identitas Kelas
          </h4>
          
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Nama Kelas</span>
            <span className="text-sm font-bold text-gray-900">{selectedClass?.name || "-"}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Tipe / Model KBM</span>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              classType === "ONLINE" ? "bg-purple-100 text-purple-700" :
              classType === "PRIVATE" ? "bg-emerald-100 text-emerald-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {classType}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Penetapan Lokasi</span>
            {classType === "REGULER" && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <MapPin size={14} className="text-rose-500"/>
                {formData.room_name ? `${formData.room_name} ` : "Belum Set Ruang"}
              </div>
            )}
            {classType === "ONLINE" && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 truncate">
                <Globe size={14} className="shrink-0"/> 
                <a href={formData.meeting_url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                  {formData.meeting_url || "Link belum diisi"}
                </a>
              </div>
            )}
            {classType === "PRIVATE" && (
              <div className="text-xs font-bold text-emerald-700 italic">
                Sesuai Alamat Siswa
              </div>
            )}
          </div>
        </div>

        {/* MASTER POLA MAPEL */}
        <div className="p-4 border border-gray-200 rounded-2xl bg-slate-50 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">
            Master Pola Mingguan
          </h4>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
            {formData.patterns.map((pat, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h5 className="text-xs font-bold text-gray-900">{pat.subject_name}</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium truncate">{pat.tentor_name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">
                      {getDayName(pat.day_of_week)}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      {pat.start_time} - {pat.end_time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
        <CheckCircle2 size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          Tinjau kembali pola jadwal di atas. Dengan menekan tombol <strong>Konfirmasi & Generate KBM</strong>, sistem akan secara massal menyusun sesi belajar di kalender akademik Bimbel.
        </p>
      </div>

    </div>
  );
}