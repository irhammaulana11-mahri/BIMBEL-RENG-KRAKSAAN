import React, { useEffect, useState } from "react";
import { X, CalendarClock } from "lucide-react";
import { getSubjects } from "@/services/admin/subjectService";
import { getTentors } from "@/services/admin/tentorService";
import { getClasses } from "@/services/academic/classService";
import { getApiErrorMessage } from "@/services/exam/examService";

const emptyForm = {
  subject_id: "",
  tutor_id: "",
  title: "",
  description: "",
  exam_date: "",
  duration: "",
  total_score: 100, // Default nilai maksimal ideal
  opens_at: "",
  closes_at: "",
  class_ids: [],
};

export default function ExamModal({ open, onClose, data, onSubmit }) {
  const [formData, setFormData] = useState(emptyForm);
  const [isScheduled, setIsScheduled] = useState(false);
  const [options, setOptions] = useState({ subjects: [], tentors: [], classes: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Data master untuk pilihan form
  useEffect(() => {
    if (!open) return;
    Promise.all([
      getSubjects({ perPage: 100, status: "true" }),
      getTentors({ perPage: 100 }),
      getClasses({ perPage: 100 }),
    ])
      .then(([subjects, tentors, classes]) => setOptions({
        subjects: subjects.data?.data || [],
        tentors: tentors.data?.data || [],
        classes: classes.data?.data || [],
      }))
      .catch(() => setError("Gagal memuat data mapel / tentor / kelas."));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (data) {
      setFormData({
        subject_id: data.subject_id || "",
        tutor_id: data.tutor_id || "",
        title: data.title || "",
        description: data.description || "",
        exam_date: data.exam_date || "",
        duration: data.duration || "",
        total_score: data.total_score || 100,
        opens_at: data.opens_at || "",
        closes_at: data.closes_at || "",
        class_ids: data.class_ids || [],
      });
      setIsScheduled(!!data.is_scheduled);
    } else {
      setFormData(emptyForm);
      setIsScheduled(false);
    }
  }, [data, open]);

  if (!open) return null;

  const isLocked = (data?.results_count || 0) > 0;

  const toggleClass = (classId) => {
    setFormData(prev => ({
      ...prev,
      class_ids: prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...formData,
        tutor_id: formData.tutor_id || null,
        exam_date: formData.exam_date || null,
        duration: Number(formData.duration),
        total_score: Number(formData.total_score) || 100,
        opens_at: isScheduled ? formData.opens_at : null,
        closes_at: isScheduled ? formData.closes_at : null,
        class_ids: isScheduled ? formData.class_ids : [],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan ujian."));
    } finally {
      setSaving(false);
    }
  };

  // Mapel yang dipilih harus tetap tampil walau tidak aktif lagi
  const subjectOptions = options.subjects.some(s => s.id === formData.subject_id) || !data
    ? options.subjects
    : [...options.subjects, { id: data.subject_id, name: data.subject_name }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{data ? "Edit Konfigurasi Ujian" : "Buat Modul Ujian Baru"}</h2>
          <p className="text-sm text-gray-500">Ujian dapat dijalankan tentor saat sesi KBM, atau dijadwalkan untuk kelas tertentu.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul Ujian */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Ujian / Kuis</label>
            <input
              type="text" required value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-xl border px-4 py-2.5" placeholder="Contoh: Tryout UTBK 1 Matematika, Kuis Harian Fisika"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Petunjuk Pengerjaan (Opsional)</label>
            <textarea
              rows={2} value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full rounded-xl border px-4 py-2.5 text-sm" placeholder="Kerjakan dengan jujur. Jawaban tersimpan otomatis."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Relasi Mapel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select
                required value={formData.subject_id} disabled={isLocked}
                onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                className="w-full rounded-xl border px-3 py-2.5 bg-white text-sm disabled:bg-gray-50"
              >
                <option value="">Pilih Mapel</option>
                {subjectOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Relasi Pembuat/Tentor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tentor Penanggung Jawab</label>
              <select
                value={formData.tutor_id || ""}
                onChange={(e) => setFormData({...formData, tutor_id: e.target.value})}
                className="w-full rounded-xl border px-3 py-2.5 bg-white text-sm"
              >
                <option value="">Admin (tanpa tentor)</option>
                {options.tentors.map(t => <option key={t.id} value={t.id}>{t.user?.name || t.name || "Tentor"}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Tanggal Pelaksanaan */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal (Opsional)</label>
              <input
                type="date" value={formData.exam_date || ""}
                onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            {/* Durasi Ujian */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
              <input
                type="number" min={1} required value={formData.duration} disabled={isLocked}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-50" placeholder="90"
              />
            </div>
            {/* Total Nilai Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skala Nilai</label>
              <input
                type="number" min={1} required value={formData.total_score} disabled={isLocked}
                onChange={(e) => setFormData({...formData, total_score: e.target.value})}
                className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-50" placeholder="100"
              />
            </div>
          </div>

          {isLocked && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
              Sudah ada siswa yang mengerjakan, sehingga mapel, durasi, dan skala nilai dikunci.
            </p>
          )}

          {/* Ujian terjadwal */}
          <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
              <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="rounded" />
              <CalendarClock className="w-4 h-4 text-blue-600" /> Jadwalkan ujian (tryout / PR)
            </label>
            <p className="text-xs text-gray-500">
              Tanpa jadwal, ujian hanya bisa dikerjakan saat tentor menjalankannya di sesi KBM.
            </p>

            {isScheduled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dibuka (WIB)</label>
                    <input type="datetime-local" required value={formData.opens_at} onChange={(e) => setFormData({...formData, opens_at: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ditutup (WIB)</label>
                    <input type="datetime-local" required value={formData.closes_at} onChange={(e) => setFormData({...formData, closes_at: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Kelas Peserta</p>
                  <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                    {options.classes.length === 0 ? (
                      <p className="p-3 text-xs text-gray-400">Belum ada kelas.</p>
                    ) : options.classes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 p-2.5 text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={formData.class_ids.includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded" />
                        <span className="font-medium text-gray-800">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="pt-2">
            <button type="submit" disabled={saving} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Ujian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
