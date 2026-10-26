import React, { useState, useEffect } from "react";
import { X, CalendarDays, ArrowRight, ArrowLeft, Check } from "lucide-react";
import api from "@/api/axios";
import { getUnscheduledClasses } from "@/services/academic/classService";
import { getLocations } from "@/services/admin/locationService";
import { createWizardSchedule, validateWizardSchedule } from "@/services/academic/scheduleService"; // 🟢 Import service validasi
import { useToast } from "@/hooks/useToast";

import StepClass from "./steps/StepClass";
import StepPattern from "./steps/StepPattern";
import StepLocation from "./steps/StepLocation";
import StepSessions from "./steps/StepSessions";
import StepSummary from "./steps/StepSummary";

export default function ScheduleWizardModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  
  const [locationList, setLocationList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [conflictError, setConflictError] = useState(null);
  
  const [formData, setFormData] = useState({
    class_id: "",
    class_type: "",
    start_date: "", 
    location_id: "",
    room_name: "",
    meeting_url: "",
    patterns: [], 
    generated_sessions: [], 
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setConflictError(null);
      setFormData({
        class_id: "", class_type: "", start_date: "",
        location_id: "", room_name: "", meeting_url: "",
        patterns: [], generated_sessions: []
      });
      fetchMasterData();
    }
  }, [open]);

  const fetchMasterData = async () => {
    try {
      const [resClass, resLoc] = await Promise.all([
        getUnscheduledClasses(), 
        getLocations({ perPage: 100 })
      ]);
      
      setClassList(resClass.data?.data || resClass.data || []);
      setLocationList(resLoc.data?.data || resLoc.data || []);
    } catch (err) {
      console.error("Gagal memuat master data wizard:", err);
    }
  };

  // 🟢 LOGIKA VALIDASI SEKARANG DITANGANI BACKEND
  const handleNext = async () => {
    if (step === 2) {
      try {
        setLoading(true);
        // Kirim array patterns ke backend untuk divalidasi
        await validateWizardSchedule(formData.patterns);
        
        // Jika lolos (tidak ada exception 422 dari backend)
        setConflictError(null);
        setStep(3);
      } catch (error) {
        // Tangkap pesan error bentrok dari response backend
        const errorMessage = error.response?.data?.message || "Terjadi kesalahan saat memvalidasi jadwal.";
        setConflictError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setConflictError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createWizardSchedule({
        class_id: formData.class_id,
        location_id: formData.location_id,
        room_name: formData.room_name,
        meeting_url: formData.meeting_url,
        patterns: formData.patterns,
        sessions: formData.generated_sessions,
      });
      
      showSuccess("Jadwal KBM beserta sesi berhasil di-generate!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Gagal men-generate jadwal.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isNextDisabled = () => {
    if (step === 1 && !formData.class_id) return true;
    if (step === 2) return formData.patterns.some((p) => p.day_of_week === "" || !p.start_time || !p.end_time);
    if (step === 3 && !formData.start_date) return true;
    if (step === 4 && formData.generated_sessions.length === 0) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] transition-all duration-300 ${step === 4 ? "w-full max-w-5xl" : "w-full max-w-3xl"}`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 tracking-tight">Auto-Generate Schedule Sessions</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Langkah {step} dari 5</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex gap-1.5 py-4 shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-blue-600" : "bg-gray-100"}`} />
          ))}
        </div>

        {/* WIZARD CONTENT */}
        <div className="flex-1 overflow-y-auto pb-4 px-1">
          {step === 1 && <StepClass formData={formData} setFormData={setFormData} classList={classList} />}
          {step === 2 && (
            <StepPattern 
              formData={formData} 
              setFormData={setFormData} 
              conflictError={conflictError} 
              setConflictError={setConflictError} 
            />
          )}
          {step === 3 && <StepLocation formData={formData} setFormData={setFormData} locationList={locationList} />}
          {step === 4 && <StepSessions formData={formData} setFormData={setFormData} />}
          {step === 5 && <StepSummary formData={formData} classList={classList} />}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-4 border-t border-gray-100 flex justify-between shrink-0">
          {step > 1 ? (
            <button onClick={handlePrev} className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={14} /> Kembali
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={isNextDisabled() || loading}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {loading ? "Memeriksa..." : <>Lanjut <ArrowRight size={14} /></>}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
            >
              <Check size={14} /> {loading ? "Men-generate..." : "Konfirmasi & Generate KBM"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}