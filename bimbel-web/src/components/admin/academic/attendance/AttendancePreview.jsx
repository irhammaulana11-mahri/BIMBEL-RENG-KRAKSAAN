import React from "react";
import { X, MapPin, Navigation, Info, ShieldAlert, CheckCircle } from "lucide-react";

export default function AttendancePreview({ data, onClose }) {
  if (!data) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white p-6 shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Log Geotagging</h2>
            <p className="text-xs text-gray-400 mt-1">Detail presensi siswa: <span className="font-semibold text-gray-700">{data.student_name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {/* Status Besar Area Validitas */}
          <div className={`p-4 rounded-2xl border text-sm flex gap-3 items-start ${
            data.location_valid || data.location_type === 'online'
              ? 'bg-green-50 border-green-100 text-green-800'
              : 'bg-red-50 border-red-100 text-red-800'
          }`}>
            {data.location_valid || data.location_type === 'online' ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {data.location_type === 'online' ? 'Valid (Bebas Radius)' : data.location_valid ? 'Lokasi Presensi Valid' : 'Lokasi Presensi Tidak Valid'}
              </p>
              <p className="text-xs opacity-90 mt-0.5">
                {data.location_type === 'online' 
                  ? 'Siswa menghadiri kelas daring, koordinat GPS diabaikan oleh sistem.' 
                  : `Jarak koordinat saat klik absen dengan pusat target adalah sepanjang ${data.distance_meter} meter.`}
              </p>
            </div>
          </div>

          {/* Informasi Geografis */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Navigation className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase">Koordinat Check-in Murid</p>
                <p className="text-sm font-mono text-gray-800 font-semibold mt-0.5">
                  {data.checkin_latitude || '-'}, {data.checkin_longitude || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase">Alamat Target Opsi Kelas</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{data.location_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Info className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase">Catatan / Alasan Tidak Hadir</p>
                <p className="text-sm text-gray-700 italic mt-0.5">
                  "{data.note || 'Tidak ada catatan yang dilampirkan.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Link Eksternal Google Maps */}
          {data.checkin_latitude && (
            <div className="pt-4">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${data.checkin_latitude},${data.checkin_longitude}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex justify-center items-center py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Buka Posisi di Google Maps
              </a>
            </div>
          )}
        </div>

      </div>
    </>
  );
}