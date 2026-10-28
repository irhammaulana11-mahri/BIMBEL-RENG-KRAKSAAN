import React from "react";
import { Eye, CheckCircle2, AlertCircle, XCircle, ShieldAlert } from "lucide-react";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";

export default function AttendanceTable({ data, onPreview, onVerifyGeo }) {
  const renderStatusBadge = (status) => {
    switch (status) {
      case "hadir":
        return <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-semibold uppercase">Hadir</span>;
      case "izin":
      case "sakit":
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold uppercase">{status}</span>;
      case "alfa":
        return <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold uppercase">Alfa</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  const renderGeoBadge = (item) => {
    if (item.location_type === "online") {
      return <span className="text-xs text-gray-400 italic">Bebas GPS (Online)</span>;
    }
    if (item.location_valid) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Cocok ({item.distance_meter}m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">
        <ShieldAlert className="w-3.5 h-3.5" /> Luar Radius ({item.distance_meter}m)
      </span>
    );
  };

  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(data || []);

  return (
    <div className="overflow-x-auto">
      <table className="ui-table w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-600">
            <th className="p-6">Nama Siswa</th>
            <th className="p-6">Kelas / Rombel</th>
            <th className="p-6">Mata Pelajaran</th>
            <th className="p-6">Status Hadir</th>
            <th className="p-6">Validasi GPS</th>
            <th className="p-6 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-6 text-center text-gray-400">Tidak ada log absensi pada tanggal terpilih.</td>
            </tr>
          ) : (
            pageRows.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-medium text-gray-900">{item.student_name}</td>
                <td className="p-6 text-gray-600">{item.class_name}</td>
                <td className="p-6 font-medium text-gray-500">{item.subject_name}</td>
                <td className="p-6">{renderStatusBadge(item.status)}</td>
                <td className="p-6">{renderGeoBadge(item)}</td>
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onPreview(item)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                      title="Lihat Detail Log Geolokasi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!item.location_valid && item.location_type !== "online" && (
                      <button 
                        onClick={() => onVerifyGeo(item.id)}
                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold transition-colors"
                      >
                        Bypass Lokasi
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TablePagination pagination={pagination} onPageChange={onPageChange} label="data" />
    </div>
  );
}