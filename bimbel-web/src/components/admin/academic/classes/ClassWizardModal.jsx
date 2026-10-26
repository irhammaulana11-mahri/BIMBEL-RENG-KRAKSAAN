import React, { useState, useEffect } from "react";
import { X, Check, ChevronRight, ChevronLeft, Save } from "lucide-react";
import StepPackage from "./steps/StepPackage";
import StepSubjects from "./steps/StepSubjects";
import StepTentors from "./steps/StepTentors";
import StepStudents from "./steps/StepStudents";
import StepReview from "./steps/StepReview";

import { getLocations } from "@/services/admin/locationService";
import { getPackages } from "@/services/packageService";
import { getEducationLevels } from "@/services/admin/educationLevelService";

export default function ClassWizardModal({ open, onClose, onSubmit, loading, initialData }) {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    package_id: "",
    education_level_id: "",
    class_type: "",
    education_level: "",
    meeting_per_month: 0,
    duration_minutes: 0,
    learning_location_id: "",
    max_students: 10,
    description: "",
    is_active: true,
    status: "ON_PROGRESS",
    subjects: [],
    student_ids: [],
  });

  const [masterPackages, setMasterPackages] = useState([]);
  const [masterEducationLevels, setMasterEducationLevels] = useState([]); 
  const [masterLocations, setMasterLocations] = useState([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      if (initialData) {
        setFormData({
          code: initialData.code || "",
          name: initialData.name || "",
          package_id: initialData.package_id || "",
          education_level_id: initialData.education_level_id || "",
          class_type: (initialData.class_type || "REGULER").toUpperCase(),
          education_level: initialData.education_level,
          meeting_per_month: initialData.meeting_per_month || 16,
          duration_minutes: initialData.duration_minutes || 120,
          learning_location_id: initialData.learning_location_id || "",
          max_students: initialData.max_students || 10,
          description: initialData.description || "",
          is_active: initialData.is_active ?? true,
          status: initialData.status || "ON_PROGRESS",
          subjects: (initialData.class_subjects || []).map((cs) => ({
            subject_id: cs.subject_id,
            subject_name: cs.subject_name || cs.subject?.name,
            tentor_id: cs.tentor_id || "",
            tentor_name: cs.tentor_name || cs.tentor?.name || "", // 🟢 Simpan nama untuk step review
            meeting_target: cs.meeting_target,
          })),
          student_ids: (initialData.students || []).map((st) => String(st.id || st.student_id)),
        });
      } else {
        setFormData({
          code: `CLS-${Math.floor(100 + Math.random() * 900)}`,
          name: "",
          package_id: "",
          education_level_id: "",
          class_type: "",
          education_level: "",
          meeting_per_month: 0,
          duration_minutes: 0,
          learning_location_id: "",
          max_students: 10,
          description: "",
          is_active: true,
          status: "ON_PROGRESS",
          subjects: [],
          student_ids: [],
        });
      }

      // 🟢 Hanya meload Data Master yang bersifat Global/Kecil untuk Step 1
      getPackages({ perPage: 100 }).then((res) => setMasterPackages(res.data?.data || []));
      getEducationLevels({ perPage: 100 }).then((res) => setMasterEducationLevels(res.data?.data || [])); 
      getLocations({ perPage: 100 }).then((res) => setMasterLocations(res.data?.data || []));
    }
  }, [open, initialData]);

  if (!open) return null;

  const isStep1Valid = formData.package_id && formData.code && formData.name && formData.education_level_id;


  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header Drawer Wizard */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">
              {initialData ? "Koreksi / Edit Class" : "Wizard Buat Kelas Baru"}
            </h2>
            <p className="text-xs text-gray-400">Langkah {step} dari 5 — Setup rombel, mapel, tentor, & siswa.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="flex items-center justify-between my-4 px-2 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  step === i
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : step > i
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > i ? <Check size={14} /> : i}
              </div>
              {i < 5 && <div className={`w-8 sm:w-12 h-1 rounded-full ${step > i ? "bg-emerald-500" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

        {/* Dynamic Step Content Body */}
        <div className="flex-1 overflow-y-auto p-1 space-y-4">
          {step === 1 && (
            <StepPackage 
              formData={formData} 
              setFormData={setFormData} 
              packages={masterPackages} 
              locations={masterLocations} 
              educationLevels={masterEducationLevels}
            />
          )}
          {step === 2 && <StepSubjects formData={formData} setFormData={setFormData} />}
          {step === 3 && <StepTentors formData={formData} setFormData={setFormData} />}
          {step === 4 && <StepStudents formData={formData} setFormData={setFormData} />}
          {step === 5 && <StepReview formData={formData} packages={masterPackages} locations={masterLocations} />}
        </div>

        {/* Wizard Footer Controls */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Kembali
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={step === 1 && !isStep1Valid}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
            >
              {step > 1 ? "Lanjut / Skip" : "Lanjut"} <ChevronRight size={14} />
            </button>
          ) : (
            <button
                type="button"
                disabled={loading}
                onClick={(e) => {
                    e.preventDefault();
                    
                    // Pastikan class_type terisi & UPPERCASE sebelum dikirim ke backend
                    const sanitizedForm = {
                    ...formData,
                    class_type: (formData.class_type || "REGULER").toUpperCase(),
                    // Hapus learning_location_id jika bukan REGULER
                    learning_location_id: (formData.class_type === "ONLINE" || formData.class_type === "PRIVATE") 
                        ? null 
                        : (formData.learning_location_id || null),
                    };

                    onSubmit(sanitizedForm);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                <Save size={14} /> {loading ? "Menyimpan..." : "Simpan Class"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}