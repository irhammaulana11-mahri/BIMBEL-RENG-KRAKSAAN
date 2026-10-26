import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Calendar, ArrowRight, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { getClasses } from "../../../../services/academic/classService";
import { getSubjects } from "../../../../services/admin/subjectService";
import { getTentors } from "../../../../services/admin/tentorService";
import { getLocations } from "../../../../services/admin/locationService";
import { DAYS_LIST, STANDARD_TIME_SLOTS, DAY_TO_INT_MAP, DAY_MAP } from "../../../../components/constants/schedule.constants";

import ClassStep from "./steps/ClassStep";
import SubjectStep from "./steps/SubjectStep";
import TentorStep from "./steps/TentorStep";
import CalendarStep from "./steps/CalendarStep";
import LocationStep from "./steps/LocationStep";
import ScheduleSuccessScreen from "./ScheduleSuccessScreen";

export default function ScheduleModal({ open, onClose, data, onSubmit, loading, existingSchedules = [] }) {
  const [step, setStep] = useState(1);
  const [classList, setClassList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [tentorList, setTentorList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [useCustomTime, setUseCustomTime] = useState(false);

  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    tentor_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room_name: "Ruang A-01",
    location_id: "",
    meeting_url: "",
    is_active: true,
  });

  const isEditMode = !!data;

  // 1. Reset Total & Populate Form saat Modal Dibuka / Berganti Data
  useEffect(() => {
    if (open) {
      setStep(1);
      setShowSuccessScreen(false);
      setConflictWarning(null); // 🟢 Kunci 1: Reset peringatan selalu bersih saat dibuka
      setUseCustomTime(false);
      fetchMasterData();

      if (data) {
        const rawDay = data.day_of_week;
        const dayString = typeof rawDay === "number" ? DAY_MAP[rawDay] : (rawDay || "");
        const tentorId = String(data.tentor_id || data.tentor?.id || data.tutor_id || "");
        const locId = String(data.location_id || data.location?.id || "");

        setFormData({
          class_id: String(data.class_id || data.classroom?.id || ""),
          subject_id: String(data.subject_id || data.subject?.id || ""),
          tentor_id: tentorId,
          day_of_week: dayString,
          start_time: data.start_time?.substring(0, 5) || "",
          end_time: data.end_time?.substring(0, 5) || "",
          room_name: data.room_name || "Ruang A-01",
          location_id: locId,
          meeting_url: data.meeting_url || "",
          is_active: data.is_active ?? true,
        });
      } else {
        resetForm();
      }
    }
  }, [open, data]);

  const resetForm = (keepClass = false) => {
    setFormData((prev) => ({
      class_id: keepClass ? prev.class_id : "",
      subject_id: "",
      tentor_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      room_name: "Ruang A-01",
      location_id: "",
      meeting_url: "",
      is_active: true,
    }));
  };

  const fetchMasterData = async () => {
    try {
      const [resClass, resSub, resTen, resLoc] = await Promise.all([
        getClasses({ perPage: 100 }),
        getSubjects({ perPage: 100 }),
        getTentors({ perPage: 100 }),
        getLocations({ perPage: 100 }),
      ]);
      setClassList(resClass.data?.data || resClass.data || []);
      setSubjectList(resSub.data?.data || resSub.data || []);
      setTentorList(resTen.data?.data || resTen.data || []);
      
      const locs = resLoc.data?.data || resLoc.data || [];
      setLocationList(locs);

      if (locs.length > 0 && !formData.location_id) {
        setFormData((prev) => ({
          ...prev,
          location_id: prev.location_id || String(locs[0].id),
        }));
      }
    } catch (err) {
      console.error("Gagal memuat master data jadwal:", err);
    }
  };

  const selectedClassObj = useMemo(() => {
    return classList.find((c) => String(c.id) === formData.class_id);
  }, [classList, formData.class_id]);

  const currentClassType = useMemo(() => {
    return selectedClassObj?.class_type?.toUpperCase() || "REGULER";
  }, [selectedClassObj]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClassObj) return subjectList;
    return subjectList.filter((s) => s.education_level === selectedClassObj.education_level);
  }, [subjectList, selectedClassObj]);

  const filteredTentors = useMemo(() => {
    if (!formData.subject_id) return tentorList;
    return tentorList.filter((t) => {
      if (formData.tentor_id && String(t.id) === String(formData.tentor_id)) {
        return true;
      }
      if (!t.subjects || t.subjects.length === 0) return true;
      return t.subjects.some((sub) => String(sub.id || sub.subject_id) === String(formData.subject_id));
    });
  }, [tentorList, formData.subject_id, formData.tentor_id]);

  const selectedTentorObj = useMemo(() => {
    const currentId = formData.tentor_id;
    if (!currentId) return null;
    return tentorList.find((t) => String(t.id) === String(currentId));
  }, [tentorList, formData.tentor_id]);

  const selectedTentorName = useMemo(() => {
    if (!selectedTentorObj) return "-";
    return (
      selectedTentorObj.user?.full_name ||
      selectedTentorObj.user?.name ||
      selectedTentorObj.name ||
      selectedTentorObj.tentor_name ||
      "-"
    );
  }, [selectedTentorObj]);

  // 🟢 Kunci 2: Pengecekan Bentrok Murni Hanya saat Langkah 4 / 5
  const checkConflictsRealtime = useCallback(() => {
    // Kunci Mutlak: Jangan pernah tampilkan peringatan bentrok jika belum di Step 4 / 5
    if (step < 4) {
      setConflictWarning(null);
      return;
    }

    const activeTentorId = formData.tentor_id;
    const currentScheduleId = data?.id ? String(data.id) : null;

    if (formData.day_of_week && formData.start_time && activeTentorId) {
      const targetStart = formData.start_time;
      const targetDay = formData.day_of_week;

      // Filter jadwal bentrok tentor (Abaikan data jadwal sendiri yang sedang diedit)
      const tentorConflict = existingSchedules.find((s) => {
        if (currentScheduleId && String(s.id) === currentScheduleId) return false;

        const isSameTentor = String(s.tentor_id || s.tentor?.id) === String(activeTentorId);
        const sDayStr = typeof s.day_of_week === "number" ? DAY_MAP[s.day_of_week] : s.day_of_week;
        const isSameDay = String(sDayStr).toLowerCase() === String(targetDay).toLowerCase();
        const isSameTime = (s.start_time || "").substring(0, 5) === targetStart;

        return isSameTentor && isSameDay && isSameTime;
      });

      // Filter jadwal bentrok ruangan
      const roomConflict =
        currentClassType === "REGULER" && formData.room_name && formData.location_id
          ? existingSchedules.find((s) => {
              if (currentScheduleId && String(s.id) === currentScheduleId) return false;

              const isSameRoom = s.room_name === formData.room_name;
              const isSameLoc = String(s.location_id || s.location?.id) === String(formData.location_id);
              const sDayStr = typeof s.day_of_week === "number" ? DAY_MAP[s.day_of_week] : s.day_of_week;
              const isSameDay = String(sDayStr).toLowerCase() === String(targetDay).toLowerCase();
              const isSameTime = (s.start_time || "").substring(0, 5) === targetStart;

              return isSameRoom && isSameLoc && isSameDay && isSameTime;
            })
          : null;

      if (tentorConflict) {
        // Ambil nama tentor yang presisi dari tentorObj atau tentorConflict
        const tName = selectedTentorName !== "-" ? selectedTentorName : (tentorConflict.tentor_name || "Tentor");
        setConflictWarning(
          `Tentor ${tName} sudah memiliki agenda mengajar kelas "${
            tentorConflict.class_name || tentorConflict.classroom?.class_name || "Lain"
          }" pada hari ${targetDay} jam ${targetStart}.`
        );
      } else if (roomConflict) {
        setConflictWarning(
          `Ruang ${roomConflict.room_name} di lokasi ini sudah terpakai pada hari ${targetDay} jam ${targetStart}.`
        );
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [step, formData, existingSchedules, data, selectedTentorName, currentClassType]);

  // Jalankan pengecekan secara presisi
  useEffect(() => {
    checkConflictsRealtime();
  }, [checkConflictsRealtime]);

  const handleSelectClass = (cId) => {
    if (isEditMode) return;
    setFormData((prev) => ({
      ...prev,
      class_id: String(cId),
      subject_id: "",
      tentor_id: "",
    }));
  };

  if (!open) return null;

  const handleFormEnter = (e) => {
    e.preventDefault();
    if (step < 5 && (!conflictWarning || step < 4)) {
      setStep((s) => s + 1);
    }
  };

  const handleFinalSave = async () => {
    if (conflictWarning) return;

    const activeTentorId = formData.tentor_id;
    const dayInt = typeof formData.day_of_week === "number" 
      ? formData.day_of_week 
      : DAY_TO_INT_MAP[formData.day_of_week] ?? 1;

    let finalLocationId = null;
    let finalRoomName = null;
    let finalMeetingUrl = null;

    if (currentClassType === "REGULER") {
      finalLocationId = formData.location_id || null;
      finalRoomName = formData.room_name || "Ruang A-01";
    } else if (currentClassType === "ONLINE") {
      finalLocationId = null;
      finalRoomName = null;
      finalMeetingUrl = formData.meeting_url || null;
    } else if (currentClassType === "PRIVATE") {
      finalLocationId = null;
      finalRoomName = null;
      finalMeetingUrl = null;
    }

    const payload = {
      class_id: formData.class_id,
      subject_id: formData.subject_id,
      tentor_id: activeTentorId,
      location_id: finalLocationId,
      room_name: finalRoomName,
      meeting_url: finalMeetingUrl,
      day_of_week: dayInt,
      start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
      end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time,
      is_active: formData.is_active ?? true,
    };

    try {
      const result = await onSubmit(payload);
      if (result === false) return;
      setShowSuccessScreen(true);
    } catch (err) {
      console.error("Gagal menyimpan jadwal di Modal:", err);
    }
  };

  const handleCreateAnother = () => {
    resetForm(true);
    setStep(2);
    setShowSuccessScreen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div
        className={`w-full bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[95vh] transition-all duration-500 ease-in-out ${
          showSuccessScreen
            ? "max-w-xl"
            : step === 4 && !useCustomTime
            ? "max-w-6xl"
            : "max-w-xl"
        }`}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors z-10"
        >
          <X size={20} />
        </button>

        {showSuccessScreen ? (
          <ScheduleSuccessScreen
            selectedClassObj={selectedClassObj}
            formData={formData}
            subjectList={subjectList}
            tentorList={tentorList}
            onClose={onClose}
            onCreateAnother={handleCreateAnother}
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 shrink-0 pr-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-950 tracking-tight">
                    {isEditMode ? "Edit Slot Jadwal" : "Wizard Plot Slot Jadwal"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-blue-600 font-bold">Langkah {step} dari 5</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-blue-50 text-blue-700 border-blue-200">
                      Tipe: {currentClassType}
                    </span>
                    {isEditMode && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-amber-50 text-amber-700 border-amber-200">
                        MODE EDIT (KELAS/MAPEL/TENTOR TERKUNCI)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 py-4 shrink-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-blue-600" : "bg-gray-100"
                  }`}
                />
              ))}
            </div>

            {/* 🟢 Peringatan HANYA dirender jika berada di Step 4 atau 5 */}
            {step >= 4 && conflictWarning && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-bold shrink-0">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>{conflictWarning}</p>
              </div>
            )}

            <form onSubmit={handleFormEnter} className="flex-1 overflow-y-auto space-y-4 pb-2">
              {step === 1 && (
                <ClassStep
                  formData={formData}
                  handleSelectClass={handleSelectClass}
                  classList={classList}
                  disabled={isEditMode}
                />
              )}

              {step === 2 && (
                <SubjectStep
                  selectedClassObj={selectedClassObj}
                  formData={formData}
                  setFormData={setFormData}
                  filteredSubjects={filteredSubjects}
                  disabled={isEditMode}
                />
              )}

              {step === 3 && (
                <TentorStep
                  subjectList={subjectList}
                  formData={formData}
                  setFormData={setFormData}
                  filteredTentors={filteredTentors}
                  disabled={isEditMode}
                />
              )}

              {step === 4 && (
                <CalendarStep
                  tentorName={selectedTentorName}
                  useCustomTime={useCustomTime}
                  setUseCustomTime={setUseCustomTime}
                  DAYS={DAYS_LIST}
                  STANDARD_SLOTS={STANDARD_TIME_SLOTS}
                  tutorSchedules={existingSchedules}
                  formData={formData}
                  setFormData={setFormData}
                  editingDataId={data?.id}
                />
              )}

              {step === 5 && (
                <LocationStep
                  currentClassType={currentClassType}
                  formData={formData}
                  setFormData={setFormData}
                  locationList={locationList}
                  selectedClassObj={selectedClassObj}
                  subjectName={
                    subjectList.find((s) => String(s.id) === String(formData.subject_id))?.name ||
                    subjectList.find((s) => String(s.id) === String(formData.subject_id))?.subject_name
                  }
                  tentorName={selectedTentorName}
                />
              )}

              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Kembali
                  </button>
                ) : (
                  <div />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={
                      (step === 1 && !formData.class_id) ||
                      (step === 2 && !formData.subject_id) ||
                      (step === 3 && !formData.tentor_id) ||
                      (step === 4 && (!formData.day_of_week || !formData.start_time)) ||
                      (step === 4 && conflictWarning !== null) // 🟢 HANYA kunci tombol Lanjut jika di Step 4 ada bentrok
                    }
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                  >
                    Lanjut <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSave}
                    disabled={
                      loading ||
                      conflictWarning !== null ||
                      (currentClassType === "REGULER" && !formData.location_id) ||
                      (currentClassType === "ONLINE" && !formData.meeting_url)
                    }
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                  >
                    <Check size={14} /> {loading ? "Menyimpan..." : "Kunci Jadwal"}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}