import React, { useMemo } from "react";
import { Eye, Pencil, Trash2, Calendar, Clock, MapPin, AlertTriangle } from "lucide-react";
import { TableLoading, TableEmpty, TablePagination } from "@/components/ui/table";

export default function ScheduleTable({
  data = [],
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onSelectSchedule = () => {},
  onPreview = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) {
  const renderRows = useMemo(
    () =>
      data.map((sched) => (
        <tr
          key={sched.id}
          onClick={() => onSelectSchedule(sched)}
          className={`hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${
            sched.has_conflict ? "bg-rose-50/50" : ""
          }`}
        >
          {/* Waktu / Hari */}
          <td className="px-6 py-3.5 whitespace-nowrap">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold text-gray-950 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{sched.day_of_week}</span>
                {sched.has_conflict && (
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold flex items-center gap-0.5">
                    <AlertTriangle size={11} /> Bentrok
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-gray-400 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {sched.start_time?.substring(0, 5)} - {sched.end_time?.substring(0, 5)} WIB
                </span>
              </div>
            </div>
          </td>

          {/* Kelas */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col items-start gap-1">
              {sched.class_code && sched.class_code !== "-" ? (
              <span className="font-bold text-gray-900 text-sm">{sched.class_name || sched.classroom?.class_name || "-"}</span>
              ) : null}
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded-md border border-slate-200">
                  {sched.class_code}
              </span>

            </div>
          </td>

          {/* Mata Pelajaran */}
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs bg-blue-50 text-blue-700 border border-blue-100">
              {sched.subject_name || sched.subject?.subject_name || "-"}
            </span>
          </td>

          {/* Tentor Pengampu */}
          <td className="px-6 py-4 font-bold text-gray-800 text-sm whitespace-nowrap">
            {sched.tentor_name || sched.tentor?.tentor_name || "Belum Diplot"}
          </td>

          {/* Ruang / Lokasi */}
          <td className="px-6 py-4 text-gray-600 text-sm max-w-[200px] truncate" title={sched.room_name || sched.location_name}>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{sched.room_name || sched.location_name || "Daring / Private"}</span>
            </div>
          </td>

          {/* Aksi */}
          <td className="px-6 py-4 text-center w-36 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => onEdit(sched)}
                className="rounded-xl bg-amber-50 p-2 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                title="Edit Data"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(sched.id)}
                className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                title="Hapus Data"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
      )),
    [data, onPreview, onEdit, onDelete, onSelectSchedule]
  );

  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
              <th className="px-6 py-4.5 w-64">Waktu / Hari</th>
              <th className="px-6 py-4.5">Kelas</th>
              <th className="px-6 py-4.5">Mata Pelajaran</th>
              <th className="px-6 py-4.5">Tentor Pengampu</th>
              <th className="px-6 py-4.5">Ruang / Lokasi</th>
              <th className="px-6 py-4.5 text-center w-36">Aksi</th>
            </tr>
          </thead>

          {loading ? (
            <TableLoading colSpan={6} message="Memuat data jadwal, mohon ditunggu..." />
          ) : data.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="Belum ada data Jadwal"
              description="Belum ada agenda belajar mengajar yang terdaftar."
            />
          ) : (
            <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
              {renderRows}
            </tbody>
          )}
        </table>
      </div>

      {pagination && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="data Jadwal" />
      )}
    </div>
  );
}