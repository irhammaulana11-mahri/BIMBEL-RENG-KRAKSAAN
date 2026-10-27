import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import MaterialTypeSelector from "./MaterialTypeSelector";
import MaterialFormView from "./MaterialFormView";
import { getSubjectOptions, getCurriculumOptions } from "@/services/academic/materialService";
import { getApiErrorMessage } from "@/utils/apiError";

/**
 * Tambah materi (pilih mapel -> bab -> jenis -> isi) atau ubah materi dari pustaka Modul.
 * onSubmit(formData) melempar error agar pesan tampil di modal.
 */
export default function MaterialEditorModal({ open, material, onClose, onSubmit }) {
  const isEdit = Boolean(material);
  const [step, setStep] = useState("place");
  const [subjects, setSubjects] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [type, setType] = useState("DOCUMENT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (isEdit) {
      setCurriculum({ id: material.curriculum_id, title: material.curriculum_title });
      setType(material.material_type);
      setStep("form");
      return;
    }
    setStep("place");
    setSubjectId("");
    setCurriculum(null);
    getSubjectOptions().then((res) => setSubjects(res.data.data || [])).catch((err) => setError(getApiErrorMessage(err, "Gagal memuat mapel.")));
  }, [open, material]);

  useEffect(() => {
    setCurriculum(null);
    setCurriculums([]);
    if (!subjectId) return;
    getCurriculumOptions(subjectId).then((res) => setCurriculums(res.data.data || [])).catch(() => setCurriculums([]));
  }, [subjectId]);

  if (!open) return null;

  const handleSubmit = async (form) => {
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menyimpan materi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700"><X size={20} /></button>

        {step === "place" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black text-gray-950">Tambah Materi</h3>
              <p className="text-xs text-gray-500">Pilih mapel dan bab (kurikulum) tempat materi disimpan.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Mata Pelajaran</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm bg-white">
                <option value="">-- Pilih mapel --</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.education_level_name && ` • ${s.education_level_name}`}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Bab / Kurikulum</label>
              <select value={curriculum?.id || ""} disabled={!subjectId} onChange={(e) => setCurriculum(curriculums.find((c) => c.id === e.target.value) || null)} className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm bg-white disabled:bg-gray-50">
                <option value="">-- Pilih bab --</option>
                {curriculums.map((c) => <option key={c.id} value={c.id}>{c.title}{c.semester && ` (semester ${c.semester})`}</option>)}
              </select>
              {subjectId && curriculums.length === 0 && <p className="text-xs text-amber-700 mt-1">Mapel ini belum punya bab. Tambahkan kurikulum di menu Mata Pelajaran terlebih dahulu.</p>}
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button disabled={!curriculum} onClick={() => setStep("type")} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl">Lanjut Pilih Jenis Materi</button>
          </div>
        )}

        {step === "type" && curriculum && (
          <MaterialTypeSelector curriculum={curriculum} onBack={() => setStep("place")} onSelectType={(t) => { setType(t); setStep("form"); }} />
        )}

        {step === "form" && curriculum && (
          <>
            <MaterialFormView
              curriculum={curriculum}
              materialType={type}
              initialData={isEdit ? material : null}
              onBack={() => (isEdit ? onClose() : setStep("type"))}
              onSubmit={handleSubmit}
              loading={saving}
            />
            {error && <p className="text-sm font-medium text-red-600 mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
