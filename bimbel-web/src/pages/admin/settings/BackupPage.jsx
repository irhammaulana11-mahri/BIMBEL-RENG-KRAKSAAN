import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DatabaseBackup, Download, Upload, RotateCcw, Trash2, ShieldCheck, Clock, HardDrive, Archive,
  Loader2, AlertTriangle, CheckCircle2, XCircle, CalendarClock, Save, FileArchive,
} from "lucide-react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import PremiumStatCard from "../../../components/ui/StatCard";
import TablePagination from "@/components/ui/table/TablePagination";
import useClientPagination from "@/hooks/useClientPagination";
import RestoreBackupModal from "../../../components/admin/settings/RestoreBackupModal";
import { getApiErrorMessage } from "@/utils/apiError";
import { downloadFile } from "@/utils/download";
import {
  getBackups, getBackupStatus, createBackup, updateBackupSettings, deleteBackup, uploadBackup,
  formatBytes, TYPE_BADGE, DAYS,
} from "@/services/admin/backupService";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// "2026-10-29 02:00" (WIB dari API) -> "29 Okt 2026, 02:00"
const fmt = (s) => {
  if (!s) return "-";
  const [d, t] = s.split(" ");
  const [y, m, day] = d.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}${t ? `, ${t}` : ""}`;
};

const FREQ_LABEL = { DAILY: "Setiap hari", WEEKLY: "Setiap minggu", MONTHLY: "Setiap bulan" };

export default function BackupPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [manual, setManual] = useState(null); // { include_files, note } saat modal backup manual terbuka
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreInfo, setRestoreInfo] = useState(null); // pemulihan yang sedang berjalan
  const [upload, setUpload] = useState(null); // { progress }
  const fileInput = useRef(null);
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await getBackups();
      setRows(res.data.data || []);
      setSummary(res.data.summary || {});
      setSettings((s) => s ?? res.data.settings);
      setRestoreInfo(res.data.summary?.restore || null);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat data backup."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Pantau proses yang berjalan (backup / pemulihan) sampai selesai
  const busy = summary.running || restoreInfo;
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(async () => {
      try {
        const { data } = await getBackupStatus();
        if (data.data.restore) return;
        if (restoreInfo) {
          setRestoreInfo(null);
          const last = data.data.last_restore;
          if (last?.restore_status === "SUCCESS") {
            showSuccess("Pemulihan selesai. Halaman dimuat ulang...");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showError(last?.restore_error || "Pemulihan gagal. Data tidak berubah.");
            load();
          }
          return;
        }
        if (!data.data.running) load();
      } catch {
        // abaikan; dicoba lagi pada interval berikutnya
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [busy, restoreInfo, load]);

  const runManual = async () => {
    try {
      const res = await createBackup(manual);
      setManual(null);
      showSuccess(res.data.message);
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memulai backup."));
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await updateBackupSettings(settings);
      setSettings(res.data.data);
      showSuccess(res.data.message);
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menyimpan jadwal."));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async (b) => {
    const ok = await confirm.delete({
      title: "Hapus Backup?",
      message: `${b.filename} dihapus permanen dari server dan tidak dapat dipakai untuk pemulihan lagi.`,
    });
    if (!ok) return;
    try {
      const res = await deleteBackup(b.id);
      showSuccess(res.data.message);
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menghapus backup."));
    }
  };

  const handleDownload = async (b) => {
    try {
      await downloadFile(`/admin/backups/${b.id}/download`, b.filename);
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal mengunduh backup."));
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUpload({ progress: 0 });
    try {
      const res = await uploadBackup(file, `Unggahan: ${file.name}`, (progress) => setUpload({ progress }));
      showSuccess(res.data.message);
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, err?.response?.status === 413 ? "Berkas melebihi batas upload server." : "Gagal mengunggah backup."));
    } finally {
      setUpload(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const setSetting = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const { pageRows, pagination, onPageChange } = useClientPagination(rows || []);
  const running = rows.find((r) => r.status === "RUNNING");

  // Peringatan bila backup terakhir sudah terlalu lama dibanding jadwal
  const maxAgeHours = { DAILY: 48, WEEKLY: 24 * 9, MONTHLY: 24 * 35 }[settings?.frequency] || 48;
  const stale = settings?.enabled && summary.last_success_age_hours != null && summary.last_success_age_hours > maxAgeHours;

  return (
    <div className="page-card space-y-6 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Backup & Pemulihan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cadangan database dan berkas (materi, bukti bayar, gambar website). Atur backup otomatis berkala dan pulihkan data bila terjadi masalah.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <input ref={fileInput} type="file" accept=".zip" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
          <button disabled={!!upload || !!busy} onClick={() => fileInput.current?.click()} className="flex items-center gap-2 px-4 py-3 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 disabled:opacity-50">
            {upload ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {upload ? `Mengunggah ${upload.progress}%` : "Unggah Backup"}
          </button>
          <button disabled={!!busy} onClick={() => setManual({ include_files: true, note: "" })} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
            <DatabaseBackup className="w-4 h-4" /> Backup Sekarang
          </button>
        </div>
      </div>

      {/* STATUS PROSES */}
      {running && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <p className="text-sm font-bold">Backup {running.type_label.toLowerCase()} sedang dibuat sejak {fmt(running.started_at)}. Halaman ini diperbarui otomatis.</p>
        </div>
      )}
      {!loading && !summary.scheduler_active && settings?.enabled && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Penjadwal server belum berjalan, backup otomatis tidak akan dibuat.</p>
            <p className="mt-0.5">Minta pengelola server memasang cron: <code className="px-1.5 py-0.5 bg-white rounded border text-xs">* * * * * cd /path/bimbel-api && php artisan schedule:run</code>
              {summary.scheduler_seen_at && <> (terakhir terlihat {fmt(summary.scheduler_seen_at)})</>}</p>
          </div>
        </div>
      )}
      {stale && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">Backup terakhir berhasil {Math.floor(summary.last_success_age_hours / 24)} hari lalu, lebih lama dari jadwal. Periksa riwayat backup yang gagal.</p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumStatCard title="Backup Tersimpan" value={summary.total ?? 0} desc={`Total ${formatBytes(summary.total_size)}`} icon={Archive} colorClass="text-blue-700" />
        <PremiumStatCard title="Backup Terakhir" value={summary.last_success_at ? fmt(summary.last_success_at).split(",")[0] : "-"} desc={summary.last_success_at ? `Pukul ${summary.last_success_at.split(" ")[1]} WIB` : "Belum ada backup berhasil"} icon={ShieldCheck} colorClass={summary.last_success_at && !stale ? "text-green-700" : "text-red-700"} />
        <PremiumStatCard title="Jadwal Berikutnya" value={summary.next_run_at ? fmt(summary.next_run_at).split(",")[0] : "Nonaktif"} desc={summary.next_run_at ? `Pukul ${summary.next_run_at.split(" ")[1]} WIB` : "Backup otomatis belum diaktifkan"} icon={CalendarClock} colorClass={summary.next_run_at ? "text-indigo-700" : "text-amber-700"} />
        <PremiumStatCard title="Sisa Ruang Disk" value={summary.disk_free != null ? formatBytes(summary.disk_free) : "-"} desc={`Ukuran database ${formatBytes(summary.database_size)}`} icon={HardDrive} colorClass="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* JADWAL OTOMATIS */}
        <div className="xl:col-span-2 border border-gray-200 rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2"><Clock size={18} className="text-indigo-600" /> Backup Otomatis</h2>
              <p className="text-xs text-gray-500">Dijalankan server sesuai jadwal (WIB). Backup terjadwal lama dihapus otomatis sesuai batas simpan.</p>
            </div>
            {settings && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className={`text-xs font-bold ${settings.enabled ? "text-emerald-700" : "text-gray-400"}`}>{settings.enabled ? "Aktif" : "Nonaktif"}</span>
                <button type="button" role="switch" aria-checked={settings.enabled} onClick={() => setSetting({ enabled: !settings.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.enabled ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? "translate-x-5" : ""}`} />
                </button>
              </label>
            )}
          </div>

          {settings && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${settings.enabled ? "" : "opacity-60"}`}>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Frekuensi</span>
                <select value={settings.frequency} onChange={(e) => setSetting({ frequency: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
                  {Object.entries(FREQ_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              {settings.frequency === "WEEKLY" && (
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Hari</span>
                  <select value={settings.day_of_week} onChange={(e) => setSetting({ day_of_week: Number(e.target.value) })} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
                    {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                  </select>
                </label>
              )}
              {settings.frequency === "MONTHLY" && (
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</span>
                  <select value={settings.day_of_month} onChange={(e) => setSetting({ day_of_month: Number(e.target.value) })} className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white">
                    {Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </label>
              )}
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Jam (WIB)</span>
                <input type="time" value={settings.run_time} onChange={(e) => setSetting({ run_time: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm bg-white" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Simpan</span>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={90} value={settings.retention_count} onChange={(e) => setSetting({ retention_count: Number(e.target.value) })} className="w-full rounded-xl border px-3 py-2 text-sm bg-white" />
                  <span className="text-xs text-gray-500 shrink-0">backup</span>
                </div>
              </label>
            </div>
          )}

          {settings && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={settings.include_files} onChange={(e) => setSetting({ include_files: e.target.checked })} className="w-4 h-4 rounded" />
                Sertakan berkas upload (materi, bukti bayar, gambar)
              </label>
              <button onClick={saveSettings} disabled={savingSettings} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Jadwal
              </button>
            </div>
          )}
        </div>

        {/* PROSEDUR AMAN */}
        <div className="border border-emerald-200 rounded-2xl bg-emerald-50/60 p-5 space-y-3">
          <h2 className="text-base font-black text-emerald-900 flex items-center gap-2"><ShieldCheck size={18} /> Prosedur Pemulihan Aman</h2>
          <ol className="text-xs text-emerald-900 space-y-2 list-decimal pl-4">
            <li>Arsip diverifikasi: checksum, isi dump, dan versi database.</li>
            <li>Konfirmasi password akun Anda dan ketik <b>PULIHKAN</b>.</li>
            <li>Backup pengaman kondisi saat ini dibuat otomatis lebih dulu.</li>
            <li>Sistem dikunci; pengguna lain tidak bisa menyimpan data sementara.</li>
            <li>Database diganti dalam satu transaksi. Bila gagal, data tidak berubah sama sekali.</li>
            <li>Berkas ditukar setelah database berhasil, lalu struktur database disesuaikan versi aplikasi.</li>
          </ol>
          <p className="text-[11px] text-emerald-800">Simpan salinan backup di luar server secara berkala (unduh ke komputer atau penyimpanan cloud).</p>
        </div>
      </div>

      {/* RIWAYAT */}
      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ui-table w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <th className="p-4">Waktu</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Isi</th>
                <th className="p-4 text-right">Ukuran</th>
                <th className="p-4">Dibuat oleh</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400 font-bold">Memuat riwayat backup...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-400 font-bold">Belum ada backup. Klik "Backup Sekarang" untuk membuat yang pertama.</td></tr>
              ) : pageRows.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{fmt(b.started_at)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{b.filename || "-"}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[11px] font-bold ${TYPE_BADGE[b.type] || "bg-gray-100 text-gray-600"}`}>{b.type_label}</span>
                    {b.note && <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate" title={b.note}>{b.note}</p>}
                  </td>
                  <td className="p-4 text-gray-700">
                    <p className="font-semibold flex items-center gap-1"><FileArchive size={12} className="text-gray-400" /> Database{b.include_files ? " + berkas" : ""}</p>
                    {b.include_files && b.files && <p className="text-[10px] text-gray-400">{(b.files.private || 0) + (b.files.public || 0)} berkas</p>}
                  </td>
                  <td className="p-4 text-right font-bold text-gray-800">{b.size_label || "-"}</td>
                  <td className="p-4 text-gray-600">{b.created_by || "-"}</td>
                  <td className="p-4 text-center">
                    {b.status === "SUCCESS" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold"><CheckCircle2 size={12} /> Berhasil</span>}
                    {b.status === "RUNNING" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold"><Loader2 size={12} className="animate-spin" /> Proses</span>}
                    {b.status === "FAILED" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 font-bold" title={b.error_message}><XCircle size={12} /> Gagal</span>}
                    {b.status === "FAILED" && b.error_message && <p className="text-[10px] text-red-500 mt-1 max-w-[180px] mx-auto line-clamp-2" title={b.error_message}>{b.error_message}</p>}
                    {b.restore_status === "SUCCESS" && <p className="text-[10px] text-indigo-600 font-bold mt-1">Dipulihkan {fmt(b.restored_at)}</p>}
                    {b.restore_status === "FAILED" && <p className="text-[10px] text-red-500 font-bold mt-1" title={b.restore_error}>Pemulihan gagal</p>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1">
                      {b.status === "SUCCESS" && b.file_exists && (
                        <>
                          <button onClick={() => handleDownload(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Unduh"><Download className="w-4 h-4" /></button>
                          <button disabled={!!busy} onClick={() => setRestoreTarget(b)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-40" title="Pulihkan"><RotateCcw className="w-4 h-4" /></button>
                        </>
                      )}
                      {b.status !== "RUNNING" && (
                        <button onClick={() => handleDelete(b)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination pagination={pagination} onPageChange={onPageChange} label="backup" />
      </div>

      {/* MODAL BACKUP MANUAL */}
      {manual && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-gray-950 flex items-center gap-2"><DatabaseBackup size={18} className="text-blue-600" /> Backup Sekarang</h3>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={manual.include_files} onChange={(e) => setManual({ ...manual, include_files: e.target.checked })} className="w-4 h-4 mt-0.5 rounded" />
              <span>Sertakan berkas upload<span className="block text-xs text-gray-400">Materi, bukti pembayaran, dan gambar website. Ukuran arsip lebih besar.</span></span>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Catatan (opsional)</span>
              <input value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} maxLength={255} placeholder="mis. Sebelum tutup buku Oktober" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setManual(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50">Batal</button>
              <button onClick={runManual} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">Mulai Backup</button>
            </div>
          </div>
        </div>
      )}

      <RestoreBackupModal
        backup={restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onStarted={(info) => { setRestoreTarget(null); setRestoreInfo(info); }}
      />

      {/* LAYAR KUNCI SAAT PEMULIHAN */}
      {restoreInfo && (
        <div className="fixed inset-0 bg-slate-900/70 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
            <h3 className="text-lg font-black text-gray-950">Memulihkan data...</h3>
            <p className="text-sm text-gray-600">{restoreInfo.filename}</p>
            <p className="text-xs text-gray-400">Jangan tutup halaman ini. Sistem dikunci sampai pemulihan selesai; halaman dimuat ulang otomatis.</p>
          </div>
        </div>
      )}
    </div>
  );
}
