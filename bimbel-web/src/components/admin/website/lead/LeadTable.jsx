import React, {useMemo} from "react";
import { Eye,Trash2,MessageCircle,UserPlus,CheckCircle, } from "lucide-react";
import LeadStatusBadge from "./LeadStatusBadge";
import { TableLoading,TableEmpty,TablePagination, } from "@/components/ui/table";

export default function LeadTable({
    leads = [],
    loading = false,
    pagination = null,
    onPageChange = () => {},
    onView = () => {},
    onConvert = () => {},
    onDelete = () => {},
    formatDate = (date) => date,
}) {

    const renderRows =  useMemo(() =>
        leads.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                {/* Orang Tua */}
                <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{item.parent_name}</p>
                    <p className="mt-0.5 font-mono text-[10px] font-bold tracking-wide text-gray-400">{item.email || "-"}</p>
                </td>

                {/* Siswa */}
                <td className="px-6 py-4 font-bold text-gray-900">{item.student_name}</td>

                {/* Jenjang */}
                <td className="px-6 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">{item.education_level}</span>
                </td>

                {/* Paket */}
                <td className="px-6 py-4 font-semibold text-gray-600">
                    {item.package?.package_name ??
                        item.package_name ??
                        "-"}
                </td>

                {/* WhatsApp */}
                <td className="px-6 py-4 font-mono text-sm font-bold text-gray-600">{item.phone}</td>

                {/* Status */}
                <td className="px-6 py-4">
                    <div className="flex justify-center">
                        <LeadStatusBadge status={item.status} />
                    </div>
                </td>

                {/* Tanggal */}
                <td className="px-6 py-4 text-center text-xs font-bold text-gray-400">{formatDate(item.created_at)}</td>

                {/* Action */}
                <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => onView(item)} className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            title="Lihat Detail"
                        >
                            <Eye size={18} />
                        </button>
                        <a
                            href={`https://wa.me/${item.phone
                                .replace(/^0/, "62")
                                .replace(/[^\d]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center rounded-xl bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                            title="WhatsApp"
                        >
                            <MessageCircle size={18} />
                        </a>

                        {item.status !== "REGISTERED" ? (
                            <button
                                onClick={() => onConvert(item.id)}
                                className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                                title="Aktivasi"
                            >
                                <UserPlus size={18} />
                            </button>
                        ) : (
                            <div
                                className="p-2 text-gray-300"
                                title="Sudah Terdaftar"
                            >
                                <CheckCircle size={18} />
                            </div>
                        )}

                        <button
                            onClick={() => onDelete(item.id)}
                            className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            title="Hapus"
                        >
                            <Trash2 size={18} />
                        </button>

                    </div>
                </td>
            </tr>
        )), [leads, formatDate]
      );

    return (
        <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 text-sm font-bold uppercase tracking-wider text-gray-600">
                            <th className="px-6 py-4.5">Orang Tua / Wali</th>
                            <th className="px-6 py-4.5">Nama Calon Siswa</th>
                            <th className="px-6 py-4.5">Jenjang</th>
                            <th className="px-6 py-4.5">Paket Pilihan</th>
                            <th className="px-6 py-4.5">Nomor WhatsApp</th>
                            <th className="w-32 px-6 py-4.5 text-center">Status</th>
                            <th className="w-32 px-6 py-4.5 text-center">Tanggal</th>
                            <th className="w-40 px-6 py-4.5 text-center">Aksi</th>
                        </tr>
                    </thead>

                    {loading ? (
                    <TableLoading colSpan={8} message="Memuat data, mohon ditunggu beberapa saat..."/>
                ) : leads.length === 0 ? (
                    <TableEmpty colSpan={8}
                        title="Belum ada data Lead"
                        description="Belum ada pengajuan pendaftaran baru dari website."
                    />
                ) : (
                    <tbody className="divide-y divide-gray-50 text-base font-medium text-gray-700">
                        {renderRows}
                    </tbody>
                )}
                </table>
            </div>

            {pagination && (
                <TablePagination
                    pagination={pagination}
                    onPageChange={onPageChange}
                    label="data lead"
                />
            )}
        </div>
    );
}
