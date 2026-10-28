import { useEffect, useState } from "react";
import { MapPin, Navigation, LogIn, MapPinned, Video, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCurrentPosition, distanceMeter, mapsLink } from "@/utils/geo";
import { REQUEST_STATUS } from "@/services/parent/parentService";

/**
 * Panel absen masuk tentor di Ruang Kerja Sesi (sebelum sesi dimulai).
 * Mengambil GPS, menampilkan jarak ke titik sasaran, lalu memanggil onCheckIn(position).
 * Di luar radius / di luar jam tetap boleh absen, server memberi keterangan.
 */
export default function TentorCheckInPanel({ session, onCheckIn, onRequestLocation, onCancelLocationRequest }) {
  const target = session.attendance_target || {};
  const rules = session.attendance_rules || {};
  const request = session.location_change_request;
  const needsGps = target.requires_gps;
  const hasTarget = target.latitude != null && target.longitude != null;

  const [position, setPosition] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locate = async () => {
    setLocating(true);
    setGpsError("");
    try {
      setPosition(await getCurrentPosition());
    } catch (e) {
      setGpsError(e.message);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (needsGps) locate();
  }, [needsGps]);

  const distance = position && hasTarget
    ? Math.round(distanceMeter(position.latitude, position.longitude, target.latitude, target.longitude))
    : null;
  const outside = distance !== null && distance > target.radius_meter;

  // Jendela jam absen masuk menurut jam perangkat (server tetap jadi acuan)
  const startAt = new Date(`${session.session_date}T${session.start_time}:00+07:00`);
  const endAt = new Date(`${session.session_date}T${session.end_time}:00+07:00`);
  const now = new Date();
  const earlyLimit = new Date(startAt.getTime() - (rules.early_checkin_minutes ?? 30) * 60000);
  const outsideTime = now < earlyLimit || now > endAt;

  const submit = async () => {
    setSubmitting(true);
    try {
      await onCheckIn(needsGps ? position : {});
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || (needsGps && !position);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">Absen Masuk</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Absen masuk sekaligus memulai sesi. Absensi siswa dapat diisi setelah Anda absen.
        </p>
      </div>

      {/* Titik sasaran */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-gray-200">
        {target.type === "ONLINE" ? <Video size={18} className="text-indigo-600 mt-0.5" /> : <MapPin size={18} className="text-indigo-600 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900">{target.label}</p>
          {target.address && <p className="text-xs text-gray-500">{target.address}</p>}
          {hasTarget && (
            <p className="text-xs text-gray-500 mt-0.5">
              Toleransi {target.radius_meter} m •{" "}
              <a href={mapsLink(target.latitude, target.longitude)} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Lihat di peta</a>
            </p>
          )}
          {needsGps && !hasTarget && (
            <p className="text-xs font-semibold text-amber-700 mt-0.5">Titik lokasi belum diatur Admin, jarak tidak dapat dihitung. Posisi Anda tetap dicatat.</p>
          )}
          {target.type === "ONLINE" && <p className="text-xs text-gray-500">Kelas online tidak memerlukan GPS.</p>}
        </div>
      </div>

      {/* Status GPS */}
      {needsGps && (
        <div className={`p-4 rounded-xl border text-sm ${gpsError ? "bg-rose-50 border-rose-200" : outside ? "bg-amber-50 border-amber-200" : position ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
          {locating && <p className="font-bold text-gray-600 flex items-center gap-2"><Navigation size={14} className="animate-spin" /> Mengambil lokasi GPS...</p>}
          {!locating && gpsError && <p className="font-bold text-rose-700">{gpsError}</p>}
          {!locating && position && (
            <div className="space-y-0.5">
              {distance !== null ? (
                <p className={`font-black flex items-center gap-2 ${outside ? "text-amber-800" : "text-emerald-700"}`}>
                  {outside ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                  {outside ? `Anda berada ±${distance} m dari lokasi (melebihi ${target.radius_meter} m)` : `Dalam area (±${distance} m dari lokasi)`}
                </p>
              ) : (
                <p className="font-bold text-gray-700">Lokasi Anda didapat.</p>
              )}
              <p className="text-xs text-gray-500">Akurasi GPS ±{Math.round(position.accuracy)} m{outside ? " • Absen tetap bisa dilakukan, namun akan diberi keterangan di luar lokasi." : ""}</p>
            </div>
          )}
          {!locating && (
            <button type="button" onClick={locate} className="mt-2 text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
              <Navigation size={12} /> {position ? "Perbarui lokasi" : "Coba ambil lokasi lagi"}
            </button>
          )}
        </div>
      )}

      {outsideTime && (
        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
          <AlertTriangle size={13} /> Saat ini di luar jam absen ({rules.early_checkin_minutes ?? 30} menit sebelum mulai s/d jam selesai). Absen akan diberi keterangan di luar jam.
        </p>
      )}

      <button onClick={submit} disabled={disabled} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black flex justify-center items-center gap-2">
        <LogIn size={16} /> {submitting ? "Memproses..." : "Absen Masuk & Mulai Sesi"}
      </button>

      {/* Pengajuan lokasi sementara */}
      {target.type !== "ONLINE" && (
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          {request ? (
            <div className="text-xs">
              <span className="font-bold text-gray-600">Pengajuan lokasi "{request.location_name}" oleh {request.requester_type === "PARENT" ? "orang tua" : "Anda"}: </span>
              <span className={`px-2 py-0.5 rounded font-black ${REQUEST_STATUS[request.status]?.className}`}>{REQUEST_STATUS[request.status]?.label}</span>
              {request.review_note && <span className="text-gray-500"> • {request.review_note}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Les dipindah sementara ke tempat lain? Ajukan ke Admin sebelum sesi dimulai.</p>
          )}
          <div className="flex gap-2">
            {request?.status === "PENDING" && request.requester_type === "TENTOR" && (
              <button onClick={() => onCancelLocationRequest(request.id)} className="text-xs font-black text-rose-600 hover:underline">Batalkan pengajuan</button>
            )}
            {session.can_request_location && request?.status !== "PENDING" && (
              <button onClick={onRequestLocation} className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-black flex items-center gap-1.5">
                <MapPinned size={14} /> Ajukan lokasi sementara
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
