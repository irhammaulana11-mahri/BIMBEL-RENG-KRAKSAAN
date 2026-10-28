import React, { useEffect, useState } from "react";
import { Plus, Search, BookOpen, CheckCircle2, Layers, Eye, Pencil, Power, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import useAuth from "@/hooks/useAuth";
import MaterialEditorModal from "../../../components/admin/academic/material/MaterialEditorModal";
import { MATERIAL_TYPES } from "../../../components/constants/material.constants";
import {
  getMaterials, getSubjectOptions, createMaterial, updateMaterial, toggleMaterialStatus, deleteMaterial, openMaterialProtectedPreview,
} from "@/services/academic/materialService";
import { getApiErrorMessage } from "@/utils/apiError";
import StatCard from "../../../components/ui/StatCard";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";


export default function LearningMaterialPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ keyword: "", subject_id: "", material_type: "", status: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState({ open: false, material: null });

  const load = async () => {
    try {
      const res = await getMaterials({ ...filters, per_page: 15 });
      setRows(res.data.data || []);
      setMeta(res.data.meta || { current_page: 1, last_page: 1, total: 0 });
      setSummary(res.data.summary);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat materi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    getSubjectOptions().then((res) => setSubjects(res.data.data || [])).catch(() => {});
  }, []);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  // Dipanggil MaterialEditorModal; error dilempar kembali agar tampil di modal
  const handleSave = async (form) => {
    if (editor.material) await updateMaterial(editor.material.id, form);
    else await createMaterial(form);
    showSuccess(editor.material ? "Materi diperbarui." : "Materi ditambahkan.");
    setEditor({ open: false, material: null });
    load();
  };

  const handleToggle = async (m) => {
    try {
      await toggleMaterialStatus(m.id);
      showSuccess(m.is_active ? "Materi dinonaktifkan (tidak tampil ke siswa)." : "Materi diaktifkan.");
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal mengubah status materi."));
    }
  };

  const handleDelete = async (m) => {
    const ok = await confirm.delete({ title: "Hapus Materi?", message: `"${m.title}" beserta berkasnya akan dihapus permanen.` });
    if (!ok) return;
    try {
      await deleteMaterial(m.id);
      showSuccess("Materi dihapus.");
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menghapus materi."));
    }
  };

  const openMaterial = (m) => {
    if (m.file_path) return openMaterialProtectedPreview(m, user);
    const url = m.video_url || m.external_url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const byType = summary?.by_type || {};

  // Paginasi tabel di sisi browser (data dimuat sekaligus)
  const { pageRows, pagination, onPageChange } = useClientPagination(rows || []);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Modul & Materi</h1>
            <p className="text-base text-gray-500 mt-1">Pustaka seluruh materi belajar lintas mapel. Berkas tersimpan privat dan hanya dapat dibuka tentor & siswa yang berhak.</p>
          </div>
          <button onClick={() => setEditor({ open: true, material: null })} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shrink-0">
            <Plus className="w-4 h-4" /> Tambah Materi
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Materi" value={summary.total} desc={`${summary.active} aktif • ${summary.total - summary.active} nonaktif`} icon={BookOpen} colorClass="bg-slate-50 text-slate-600" />
            <StatCard title="Sudah Dipakai di Kelas" value={summary.used} desc="Materi yang pernah dibahas di aktivitas sesi" icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-700" />
            <StatCard title="Jenis Materi" value={Object.keys(byType).length} desc={Object.entries(byType).map(([t, n]) => `${MATERIAL_TYPES[t]?.badgeLabel || t} ${n}`).join(" • ") || "-"} icon={Layers} colorClass="bg-indigo-50 text-indigo-700" />
          </div>
        )}

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/40">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={filters.keyword} onChange={(e) => setFilter({ keyword: e.target.value })} placeholder="Cari judul materi atau bab..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm bg-white" />
            </div>
            <select value={filters.subject_id} onChange={(e) => setFilter({ subject_id: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
              <option value="">Semua mapel</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.education_level_name && ` • ${s.education_level_name}`}</option>)}
            </select>
            <select value={filters.material_type} onChange={(e) => setFilter({ material_type: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
              <option value="">Semua jenis</option>
              {Object.values(MATERIAL_TYPES).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className="rounded-xl border px-3 py-2.5 text-sm bg-white">
              <option value="">Semua status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="ui-table w-full text-left text-sm min-w-[860px]">
              <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr><th className="p-4">Materi</th><th className="p-4">Mapel / Bab</th><th className="p-4">Jenis</th><th className="p-4 text-center">Dipakai</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Memuat materi...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">Belum ada materi pada filter ini.</td></tr>
                ) : pageRows.map((m) => {
                  const type = MATERIAL_TYPES[m.material_type];
                  const openable = m.file_path || m.video_url || m.external_url;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-400">{m.duration_minutes ? `${m.duration_minutes} menit` : ""}{m.tentor_name && ` • ${m.tentor_name}`}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="font-semibold text-gray-800">{m.subject_name}{m.education_level && <span className="text-gray-400 font-medium"> • {m.education_level}</span>}</p>
                        <p className="text-gray-500">{m.curriculum_title}</p>
                      </td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${type?.badgeBg || "bg-gray-50 text-gray-600 border-gray-200"}`}>{type?.badgeLabel || m.material_type}</span></td>
                      <td className="p-4 text-center text-xs font-bold text-gray-700">{m.usage_count > 0 ? `${m.usage_count} sesi` : "-"}</td>
                      <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${m.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{m.is_active ? "Aktif" : "Nonaktif"}</span></td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <button disabled={!openable} onClick={() => openMaterial(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30" title={m.file_path ? "Pratinjau terlindungi" : "Buka tautan"}>
                            {m.file_path ? <Eye className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setEditor({ open: true, material: m })} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Ubah"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleToggle(m)} className={`p-2 rounded-lg ${m.is_active ? "text-gray-500 hover:bg-gray-100" : "text-emerald-600 hover:bg-emerald-50"}`} title={m.is_active ? "Nonaktifkan" : "Aktifkan"}><Power className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(m)} disabled={m.usage_count > 0} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30" title={m.usage_count > 0 ? "Sudah dipakai di sesi: nonaktifkan saja" : "Hapus"}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      <TablePagination pagination={pagination} onPageChange={onPageChange} label="data" />

          {meta.last_page > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 text-xs text-gray-500">
              <span>Halaman {meta.current_page} dari {meta.last_page} • {meta.total} materi</span>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft size={14} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <MaterialEditorModal open={editor.open} material={editor.material} onClose={() => setEditor({ open: false, material: null })} onSubmit={handleSave} />
    </div>
  );
}
