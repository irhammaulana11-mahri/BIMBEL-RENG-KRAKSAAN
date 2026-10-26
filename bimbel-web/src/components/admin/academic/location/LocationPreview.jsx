import React, { useState } from "react";
import { 
  X, MapPin, Edit3, Calendar, Layers, ExternalLink, Navigation, 
  CheckCircle2, Users, BookOpen, Clock, ShieldCheck, BarChart3, Info
} from "lucide-react";

export default function LocationPreview({ location, open, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!open || !location) return null;

  const isActive = location.is_active ?? true;
  const mapsUrl = location.latitude && location.longitude 
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.location_name + " " + location.address)}`;

  const schedules = location.schedules || [];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200" />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[540px] bg-white shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
        
        {/* Header Sheet */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/70 relative shrink-0">
          <button onClick={onClose} className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 font-black text-xl flex items-center justify-center shadow-xs shrink-0 border border-blue-100">
              <MapPin size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {isActive ? "Gedung Aktif" : "Nonaktif"}
                </span>
                <span className="text-[10px] font-mono text-gray-400">Radius: {location.radius_meter || 100}m</span>
              </div>
              <h2 className="text-xl font-black text-gray-950 tracking-tight mt-1">{location.location_name}</h2>
              <p className="text-xs font-mono font-bold text-blue-600">{location.code || "LOC001"}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 px-6 pt-2 flex items-center gap-2 bg-white shrink-0 overflow-x-auto scrollbar-none">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Info size={14}/>} label="Overview" />
          <TabBtn active={activeTab === "classes"} onClick={() => setActiveTab("classes")} icon={<Layers size={14}/>} label="Kelas Terikat" count={schedules.length} />
          <TabBtn active={activeTab === "schedules"} onClick={() => setActiveTab("schedules")} icon={<Calendar size={14}/>} label="Jadwal Sesi" count={schedules.length} />
          <TabBtn active={activeTab === "statistics"} onClick={() => setActiveTab("statistics")} icon={<BarChart3 size={14}/>} label="Statistik" />
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Map Geofencing Card */}
              <div className="w-full h-36 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-white relative overflow-hidden p-4">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_2px,transparent_2px)] [background-size:16px_16px]" />
                
                {/* Visual Circle Geofence */}
                <div className="absolute w-28 h-28 rounded-full border-2 border-blue-400/40 bg-blue-500/10 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full border border-blue-400/60 bg-blue-500/20 flex items-center justify-center">
                  <MapPin size={22} className="text-blue-400 drop-shadow-md" />
                </div>

                <div className="z-10 mt-auto text-center space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800">
                    📍 Geofence Radius: {location.radius_meter || 100} Meter
                  </span>
                </div>
              </div>

              {/* Quick Action: Open Google Maps */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
              >
                <ExternalLink size={14} className="text-blue-600" /> Buka Lokasi di Google Maps
              </a>

              {/* Information Rows */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <InfoRow label="Alamat Lengkap Gedung" value={location.address} />
                <InfoRow label="Titik Koordinat GPS" value={location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : "Belum diset"} isMono />
                <InfoRow label="Status Absensi GPS" value="GPS Attendance Active (Geofenced)" badge="Verified" />
                <InfoRow label="Catatan / Patokan" value={location.description || "Tidak ada catatan tambahan."} />
              </div>
            </div>
          )}

          {/* TAB 2: KELAS TERIKAT */}
          {activeTab === "classes" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Rombel & Kelas Aktif</h3>
              {schedules.length > 0 ? (
                schedules.map((sch, i) => (
                  <div key={i} className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-xs">{sch.classroom?.name || "Rombel Kelas"}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Tentor: <strong>{sch.tentor?.user?.name || sch.tentor?.name || "-"}</strong></p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-100">
                      {sch.subject?.name || "Mata Pelajaran"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                  Belum ada kelas terikat pada gedung/lokasi ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JADWAL SESI */}
          {activeTab === "schedules" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Jadwal Sesi Belajar Terjadwal</h3>
              {schedules.length > 0 ? (
                schedules.map((sch, i) => (
                  <div key={i} className="p-3.5 bg-white border border-gray-100 rounded-2xl shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-md border border-blue-100">
                        {sch.day_name || sch.day || "Senin"}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" /> {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)} WIB
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                      <span className="font-bold text-gray-900">{sch.subject?.name}</span>
                      <span className="text-gray-500 font-medium">Ruang: <strong className="text-gray-800">{sch.classroom?.name}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                  Belum ada jadwal sesi belajar terdaftar untuk lokasi ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STATISTIK */}
          {activeTab === "statistics" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Kontribusi Cabang Gedung</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCardMini icon={<Layers size={18} className="text-blue-600" />} label="Total Rombel" value={schedules.length} />
                <StatCardMini icon={<Users size={18} className="text-purple-600" />} label="Tentor Bertugas" value={schedules.length} />
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Buttons */}
        <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0 shrink-0">
          <button
            onClick={() => onEdit(location)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl transition-all border border-amber-200 cursor-pointer shadow-2xs"
          >
            <Edit3 size={15} /> Edit Informasi Lokasi Ini
          </button>
        </div>

      </div>
    </>
  );
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"
      }`}
    >
      {icon} <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function InfoRow({ label, value, isMono = false, badge }) {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-gray-900 font-bold flex items-center gap-1.5 ${isMono ? 'font-mono' : ''}`}>
        <span>{value || '-'}</span>
        {badge && (
          <span className="px-1.5 py-0.2 bg-green-100 text-green-700 text-[9px] font-bold rounded border border-green-200">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function StatCardMini({ icon, label, value }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
      <div className="mx-auto mb-1 flex justify-center">{icon}</div>
      <p className="text-xl font-black text-gray-950 font-mono">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
    </div>
  );
}