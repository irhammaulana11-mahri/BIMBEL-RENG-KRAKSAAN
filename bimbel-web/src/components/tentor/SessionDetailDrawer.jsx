import React from "react";
import { Clock, Users, Globe, MapPin, Video, PlayCircle, ArrowRightCircle, AlertTriangle, FileText, X } from "lucide-react";

export default function SessionDetailDrawer({ 
  session, 
  isOpen, 
  onClose, 
  onStartSession, 
  onContinueSession, 
  onOpenReschedule 
}) {
  if (!isOpen || !session) return null;

  const getStatusBadge = (status) => {
    switch(status) {
      case "SCHEDULED": 
      case "RESCHEDULED": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">DIJADWALKAN</span>;
      case "PREPARING": return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">PERSIAPAN</span>;
      case "IN_PROGRESS": return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">BERLANGSUNG</span>;
      case "COMPLETED": return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">SELESAI</span>;
      default: return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        
        <div className="px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Detail Sesi KBM</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-indigo-700 leading-tight">{session.subject_name}</h2>
            <p className="text-sm font-bold text-gray-600 mt-1">{session.class_name} <span className="text-gray-400 mx-1">•</span> Meeting {session.meeting_no}</p>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 text-indigo-900">
            <Clock size={20} className="text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-black">{session.formatted_date}</p>
              <p className="text-xs font-bold text-indigo-600/80">{session.start_time} - {session.end_time} WIB</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">JUMLAH SISWA</p>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><Users size={16} className="text-gray-400"/> {session.total_students} Siswa Terdaftar</p>
            </div>
            
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LOKASI PELAKSANAAN</p>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {session.class_type === 'ONLINE' ? <Globe size={16} className="text-purple-500"/> : <MapPin size={16} className="text-rose-500"/>}
                {session.location}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">STATUS SESI</p>
              {getStatusBadge(session.status)}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex flex-col gap-3 shrink-0 bg-white">
          {['SCHEDULED', 'RESCHEDULED', 'PREPARING'].includes(session.status) && (
            <>
              {session.class_type === 'ONLINE' && (
                <button className="w-full py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-black flex justify-center items-center gap-2 transition-colors">
                  <Video size={18} /> Gabung Meeting
                </button>
              )}
              <button onClick={() => onStartSession(session.id)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex justify-center items-center gap-2 shadow-sm transition-colors">
                <PlayCircle size={18} /> Mulai Sesi KBM
              </button>
              <button onClick={onOpenReschedule} className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                <AlertTriangle size={16} /> Ajukan Reschedule
              </button>
            </>
          )}

          {session.status === 'IN_PROGRESS' && (
            <>
              {session.class_type === 'ONLINE' && (
                <button className="w-full py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-black flex justify-center items-center gap-2 transition-colors">
                  <Video size={18} /> Gabung Meeting
                </button>
              )}
              <button onClick={() => onContinueSession(session.id)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black flex justify-center items-center gap-2 shadow-sm transition-colors">
                <ArrowRightCircle size={18} /> Lanjutkan Sesi Workspace
              </button>
            </>
          )}

          {session.status === 'COMPLETED' && (
            <>
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-sm font-black flex justify-center items-center gap-2 cursor-not-allowed">Sesi Selesai</div>
              <button onClick={() => onContinueSession(session.id)} className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-colors">
                <FileText size={16} /> Lihat Ringkasan Sesi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}