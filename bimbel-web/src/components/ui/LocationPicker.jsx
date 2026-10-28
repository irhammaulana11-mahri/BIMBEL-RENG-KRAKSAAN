import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Navigation } from "lucide-react";
import { getCurrentPosition } from "@/utils/geo";

// Ikon bawaan leaflet tidak ikut ter-bundle oleh Vite
const pinIcon = L.icon({
  iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41],
});

// Titik awal peta bila belum ada koordinat: Kraksaan, Probolinggo
const DEFAULT_CENTER = [-7.7561, 113.4157];

const toNumber = (v) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [map, lat, lng]);
  return null;
}

/**
 * Pemilih titik koordinat: klik/geser pin di peta, ambil GPS perangkat, atau ketik manual.
 * value: { latitude, longitude }; onChange menerima { latitude, longitude } (string 6 desimal).
 */
export default function LocationPicker({ value, onChange, radius, height = 240, label = "Titik Lokasi" }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const lat = toNumber(value?.latitude);
  const lng = toNumber(value?.longitude);
  const point = lat !== null && lng !== null ? [lat, lng] : null;

  const pick = (la, ln) => onChange({ latitude: la.toFixed(6), longitude: ln.toFixed(6) });

  const useGps = async () => {
    setGpsError("");
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      pick(pos.latitude, pos.longitude);
    } catch (e) {
      setGpsError(e.message);
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{label}</span>
        <button type="button" onClick={useGps} disabled={gpsLoading} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50">
          <Navigation size={12} className={gpsLoading ? "animate-spin" : ""} />
          {gpsLoading ? "Mendeteksi..." : "Gunakan lokasi saat ini"}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 relative z-0" style={{ height }}>
        <MapContainer center={point || DEFAULT_CENTER} zoom={point ? 16 : 13} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onPick={pick} />
          <Recenter lat={lat} lng={lng} />
          {point && (
            <>
              <Marker position={point} icon={pinIcon} draggable eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); pick(p.lat, p.lng); } }} />
              {radius ? <Circle center={point} radius={Number(radius)} pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.12 }} /> : null}
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-[11px] text-gray-400">Klik peta atau geser pin untuk menentukan titik.</p>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="any" placeholder="Latitude" value={value?.latitude ?? ""}
          onChange={(e) => onChange({ latitude: e.target.value, longitude: value?.longitude ?? "" })}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500" />
        <input type="number" step="any" placeholder="Longitude" value={value?.longitude ?? ""}
          onChange={(e) => onChange({ latitude: value?.latitude ?? "", longitude: e.target.value })}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500" />
      </div>
      {gpsError && <p className="text-[11px] font-semibold text-rose-600">{gpsError}</p>}
    </div>
  );
}

// Peta baca-saja untuk drawer detail (titik + lingkaran radius absen)
export function MapView({ latitude, longitude, radius, height = 180 }) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat === null || lng === null) {
    return <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 text-xs text-gray-400 flex items-center justify-center" style={{ height }}>Titik koordinat belum diatur.</div>;
  }
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 relative z-0" style={{ height }}>
      <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pinIcon} />
        {radius ? <Circle center={[lat, lng]} radius={Number(radius)} pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.12 }} /> : null}
      </MapContainer>
    </div>
  );
}
