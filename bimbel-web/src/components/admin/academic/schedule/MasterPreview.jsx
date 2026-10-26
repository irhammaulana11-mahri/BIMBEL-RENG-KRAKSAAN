import React from "react";
import { X, CalendarClock, Clock, User, MapPin, Edit2, PlayCircle, PauseCircle } from "lucide-react";
import Toast from "../../../../components/ui/Toast";
import { useToast } from "../../../../hooks/useToast";
import { DAY_MAP } from "@/components/constants/schedule.constants"; // pastikan path sesuai

export default function MasterPreview({ open, master, onClose, onEditPattern, onToggleStatus }) {
  const { toast, showSuccess, showError, hideToast } = useToast();

  if (!open || !master) return null;

  // Pemetaan Index Hari ke String
  const isActive = master.is_active || master.status === "ACTIVE";

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-sm z-40 transition-opacity"
        onClick={onClose}
      />
        <Toast {...toast} onClose={hideToast} />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Preview Master Pola</h3>
              <p className="text-xs font-semibold text-gray-500">Template Jadwal Rutin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          <div className="text-center">
            <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full mb-3 ${
              isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
            }`}>
              {isActive ? "Status: AKTIF" : "Status: NONAKTIF"}
            </span>
            <h2 className="text-2xl font-black text-gray-900 leading-tight">{master.subject_name}</h2>
            <p className="text-sm font-bold text-amber-600 mt-1">{master.class_name}</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pola Waktu</p>
                <p className="text-sm font-bold text-gray-800">
                  Tiap Hari {DAY_MAP[master.day_of_week] ?? master.session_date}
                </p>
                <p className="text-xs font-semibold text-gray-500">{master.start_time} - {master.end_time} WIB</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
              <User size={18} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tentor Pengampu</p>
                <p className="text-sm font-bold text-gray-800">{master.tentor_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
              <MapPin size={18} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fasilitas / Lokasi</p>
                <p className="text-sm font-bold text-gray-800">{master.room_name || (master.class_type === "ONLINE" ? "Online Meeting" : "-")}</p>
                {master.meeting_url && (
                  <a href={master.meeting_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline break-all mt-1 block">
                    {master.meeting_url}
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
             <p className="text-xs font-medium text-amber-800 text-center">
               Ini adalah Data Master. Perubahan pada Edit Pola akan mempengaruhi *generate* jadwal ke depannya.
             </p>
          </div>

        </div>

        {/* FOOTER ACTION BUTTONS */}
        <div className="p-5 border-t border-gray-100 bg-white grid grid-cols-2 gap-3 shrink-0">
          <button 
            onClick={onToggleStatus}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-colors border ${
              isActive 
                ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50" 
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {isActive ? <><PauseCircle size={16} /> Nonaktifkan</> : <><PlayCircle size={16} /> Aktifkan Pola</>}
          </button>
          
          <button 
            onClick={onEditPattern}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm shadow-amber-500/20 transition-colors"
          >
            <Edit2 size={16} /> Edit Pola Jadwal
          </button>
        </div>
      </div>
    </>
  );
}