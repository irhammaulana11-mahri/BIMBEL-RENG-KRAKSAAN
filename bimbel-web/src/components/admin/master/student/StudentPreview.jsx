import React from "react";
import { X,User,Phone,Mail,MapPin,GraduationCap,BookOpen,Calendar,Clock,CheckCircle2,Award,PlusCircle,CalendarPlus, 
  Printer,UserX,UserCheck } from "lucide-react";

export default function StudentPreview({student,onClose,onPlotSubject,onManageSchedule,onPrintCard,onToggleStatus}) {
  if (!student) return null;

  const isActive = student.user?.is_active ?? student.is_active ?? false;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200" 
      />

      {/* Sheet Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[500px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Header Sheet */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/70 relative">
          <button 
            onClick={onClose} 
            className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
          
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
            Student Academic Sheet
          </span>
          
          <h2 className="text-2xl font-black text-gray-950 tracking-tight mt-2">
            {student.student_name || student.full_name}
          </h2>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono font-bold text-gray-500 bg-gray-200/60 px-2.5 py-0.5 rounded-md">
              NIS: {student.nis || "-"}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
              isActive 
                ? 'bg-green-50 text-green-700 border-green-200/60' 
                : 'bg-red-50 text-red-700 border-red-200/60'
            }`}>
              {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
              {student.education_level || 'SD'} {student.grade ? `• Kelas ${student.grade}` : ''}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* ================= 1. KELOMPOK: WALI MURID ================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Orang Tua / Wali Murid
            </h3>
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <InfoRow 
                icon={<User size={16} />} 
                label="Nama Wali" 
                value={student.parent?.full_name || student.parent?.parent_name || '-'} 
              />
              <InfoRow 
                icon={<Phone size={16} />} 
                label="No WhatsApp" 
                value={student.parent?.phone || student.parent?.user?.phone || '-'} 
                isMono
              />
              <InfoRow 
                icon={<Mail size={16} />} 
                label="Email" 
                value={student.parent?.user?.email || '-'} 
              />
              <InfoRow 
                icon={<MapPin size={16} />} 
                label="Alamat Domisili" 
                value={student.parent?.address || student.address || '-'} 
              />
            </div>
          </div>

          {/* ================= 2. KELOMPOK: AKADEMIK ================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Informasi Akademik & Bimbingan
            </h3>
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <InfoRow 
                icon={<GraduationCap size={16} />} 
                label="Paket Bimbingan" 
                value={student.package?.package_name || student.package_name || 'Reguler Paket'} 
              />
              
              {/* Mata Pelajaran (List / Badges) */}
              <div className="flex gap-3 items-start text-sm pt-1">
                <div className="text-blue-600 bg-blue-50 p-2 rounded-xl shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mata Pelajaran</div>
                  {student.subjects && student.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {student.subjects.map((sub, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-lg shadow-2xs">
                          {sub}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Belum di-plotting mata pelajaran</p>
                  )}
                </div>
              </div>

              <InfoRow 
                icon={<User size={16} />} 
                label="Tentor Pembimbing Utama" 
                value={student.tentor?.name || student.tentor_name || 'Belum Ditentukan'} 
              />
              <InfoRow 
                icon={<Clock size={16} />} 
                label="Jadwal Kelas Rutin" 
                value={student.schedule_info || 'Selasa & Kamis (15:30 WIB)'} 
              />
            </div>
          </div>

          {/* ================= 3. KELOMPOK: HISTORI ================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Histori Performa & Kehadiran
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Kehadiran
                </div>
                <p className="text-xl font-black text-gray-950 font-mono">
                  {student.attendance_rate || "95%"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Sangat Baik</p>
              </div>

              <div className="bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                  <Award size={14} className="text-blue-500" /> Rata-Rata Ujian
                </div>
                <p className="text-xl font-black text-gray-950 font-mono">
                  {student.average_score || "88.5"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">Hasil Evaluasi Try Out</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="p-5 border-t border-gray-100 bg-white space-y-2 sticky bottom-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPlotSubject && onPlotSubject(student)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all border border-blue-100 cursor-pointer"
            >
              <PlusCircle size={15} />
              Plot Mata Pelajaran
            </button>

            <button
              onClick={() => onManageSchedule && onManageSchedule(student)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all border border-purple-100 cursor-pointer"
            >
              <CalendarPlus size={15} />
              Atur Jadwal
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPrintCard && onPrintCard(student)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              <Printer size={15} />
              Cetak Kartu Siswa
            </button>

            <button
              onClick={() => onToggleStatus && onToggleStatus(student)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 font-bold text-xs rounded-xl transition-all border cursor-pointer ${
                isActive
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
              {isActive ? 'Nonaktifkan Murid' : 'Aktifkan Murid'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

// Sub-komponen Baris Informasi
function InfoRow({ icon, label, value, isMono = false }) {
  return (
    <div className="flex gap-3 items-start text-sm">
      <div className="text-blue-600 bg-white p-1.5 rounded-lg border border-gray-100 shadow-2xs shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="space-y-0.5 overflow-hidden">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className={`text-gray-900 font-bold text-sm truncate ${isMono ? 'font-mono' : ''}`}>
          {value || '-'}
        </div>
      </div>
    </div>
  );
}