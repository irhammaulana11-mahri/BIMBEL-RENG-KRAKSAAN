import React, { useState, useEffect } from "react";
import { X, BookOpen, FileText, MessageCircle, RefreshCw, ArrowLeft, Search } from "lucide-react";
import { getSessionReferenceData } from "../../services/tentor/scheduleService";
import Toast from "../ui/Toast";
import { useToast } from "../../hooks/useToast";

export default function ActivityManagerModal({ isOpen, onClose, onSave, sessionInfo }) {
  const [step, setStep] = useState('SELECT_TYPE'); 
  const [activityType, setActivityType] = useState(null);
  
  // Data Referensi dari Backend
  const [referenceData, setReferenceData] = useState({ curriculums: [], exams: [] });
  const [loadingRef, setLoadingRef] = useState(false);
  
  // State untuk Pemilihan & Form
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [searchTopic, setSearchTopic] = useState("");
  const [searchExam, setSearchExam] = useState("");

  const [formData, setFormData] = useState({ 
    title: "", description: "", start_time: "", end_time: "", activityable_id: "" 
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { toast, showError, hideToast } = useToast();

  // Default jam aktivitas mengikuti jam sesi
  const emptyForm = () => ({
    title: "", description: "", activityable_id: "",
    start_time: sessionInfo?.start_time || "", end_time: sessionInfo?.end_time || "",
  });

  useEffect(() => {
    if (isOpen && sessionInfo?.id) {
      setFormData(emptyForm());
      fetchReferenceData();
    }
  }, [isOpen, sessionInfo?.id]);

  const fetchReferenceData = async () => {
    setLoadingRef(true);
    try {
      const res = await getSessionReferenceData(sessionInfo.id);
      setReferenceData(res.data.data);
      if (res.data.data.curriculums.length > 0) {
        setSelectedCurriculumId(res.data.data.curriculums[0].id);
      }
    } catch (error) {
      showError("Gagal memuat data referensi.");
    } finally {
      setLoadingRef(false);
    }
  };

  if (!isOpen) return null;

  // --- Reset & Navigation ---
  const handleClose = () => {
    setStep('SELECT_TYPE');
    setActivityType(null);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setSelectedMaterial(null);
    setSelectedExam(null);
    setSearchTopic("");
    setSearchExam("");
    setSubmitError("");
  };

  const handleBack = (targetStep = 'SELECT_TYPE') => {
    setStep(targetStep);
  };

  const handleSelectType = (type) => {
    setActivityType(type);
    if (type === 'MATERIAL') setStep('SELECT_MATERIAL');
    else if (type === 'EXAM') setStep('SELECT_EXAM');
    else setStep(`FORM_${type}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = { ...formData, type: activityType };
    
    if (activityType === 'MATERIAL') finalData.activityable_id = selectedMaterial.id;
    if (activityType === 'EXAM') finalData.activityable_id = selectedExam.id;
    if (!finalData.activityable_id) finalData.activityable_id = null;

    // Modal hanya ditutup jika penyimpanan berhasil
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSave(finalData);
      handleClose();
    } catch (error) {
      const errors = error.response?.data?.errors;
      setSubmitError(errors ? Object.values(errors)[0][0] : error.response?.data?.message || "Gagal menyimpan aktivitas.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderSubmit = (label) => (
    <>
      {submitError && <p className="text-xs font-bold text-rose-600">{submitError}</p>}
      <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-sm mt-4 disabled:opacity-50">
        {submitting ? "Menyimpan..." : label}
      </button>
    </>
  );

  // --- Render Sections ---
  const renderSelectType = () => (
    <div className="p-6">
      <div className="mb-6">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dari Materi Pembelajaran</h4>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleSelectType('MATERIAL')} className="p-5 border border-gray-200 rounded-2xl flex flex-col items-center text-center hover:border-blue-500 hover:bg-blue-50 group transition-all">
            <BookOpen size={28} className="text-blue-400 group-hover:text-blue-600 mb-2" />
            <span className="font-black text-gray-900 text-sm">Materi</span>
            <span className="text-[10px] font-bold text-gray-500 mt-1">Pilih curriculum/topic</span>
          </button>
          <button onClick={() => handleSelectType('EXAM')} className="p-5 border border-gray-200 rounded-2xl flex flex-col items-center text-center hover:border-rose-500 hover:bg-rose-50 group transition-all">
            <FileText size={28} className="text-rose-400 group-hover:text-rose-600 mb-2" />
            <span className="font-black text-gray-900 text-sm">Exam</span>
            <span className="text-[10px] font-bold text-gray-500 mt-1">Pilih exam yang ada</span>
          </button>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Aktivitas Kelas</h4>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleSelectType('DISCUSSION')} className="p-5 border border-gray-200 rounded-2xl flex flex-col items-center text-center hover:border-purple-500 hover:bg-purple-50 group transition-all">
            <MessageCircle size={28} className="text-purple-400 group-hover:text-purple-600 mb-2" />
            <span className="font-black text-gray-900 text-sm">Diskusi</span>
            <span className="text-[10px] font-bold text-gray-500 mt-1">Interaksi pembelajaran</span>
          </button>
          <button onClick={() => handleSelectType('REVIEW')} className="p-5 border border-gray-200 rounded-2xl flex flex-col items-center text-center hover:border-amber-500 hover:bg-amber-50 group transition-all">
            <RefreshCw size={28} className="text-amber-400 group-hover:text-amber-600 mb-2" />
            <span className="font-black text-gray-900 text-sm">Review</span>
            <span className="text-[10px] font-bold text-gray-500 mt-1">Pembahasan materi</span>
          </button>
        </div>
      </div>
    </div>
  );

  // --- MATERI FLOW ---
  const renderSelectMaterial = () => {
    const activeCurriculum = referenceData.curriculums.find(c => c.id === selectedCurriculumId);
    let materials = activeCurriculum?.materials || [];
    if (searchTopic) {
      materials = materials.filter(m => m.title.toLowerCase().includes(searchTopic.toLowerCase()));
    }

    return (
      <div className="flex flex-col h-full">
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mata Pelajaran</p>
            <p className="text-sm font-bold text-gray-900">{sessionInfo?.subject_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kurikulum</p>
            <select value={selectedCurriculumId} onChange={(e) => setSelectedCurriculumId(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold bg-white focus:border-indigo-500 outline-none">
              {referenceData.curriculums.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bab / Topik</p>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Cari bab atau topik..." value={searchTopic} onChange={(e) => setSearchTopic(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
            </div>
            
            <div className="space-y-3">
              {loadingRef ? <p className="text-xs text-center text-gray-400 py-4">Memuat data...</p> : 
               materials.length === 0 ? <p className="text-xs text-center text-gray-400 py-4 font-bold">Belum ada materi aktif untuk mata pelajaran ini.</p> :
               materials.map(mat => (
                <div key={mat.id} onClick={() => setSelectedMaterial(mat)} className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedMaterial?.id === mat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <p className="text-xs font-black text-blue-600 mb-1">{activeCurriculum.title}</p>
                  <p className="text-sm font-bold text-gray-900">{mat.title}</p>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-[11px] text-gray-500 truncate pr-4">{mat.description}</p>
                    <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedMaterial?.id === mat.id ? 'border-blue-500' : 'border-gray-300'}`}>
                      {selectedMaterial?.id === mat.id && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-between bg-white shrink-0">
          <button onClick={() => handleBack('SELECT_TYPE')} className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl">Batal</button>
          <button onClick={() => { setFormData({...formData, title: selectedMaterial?.title}); setStep('FORM_MATERIAL'); }} disabled={!selectedMaterial} className="px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl disabled:opacity-50">Lanjut →</button>
        </div>
      </div>
    );
  };

  const renderFormMaterial = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">MATERI TERPILIH</p>
        <p className="text-sm font-bold text-blue-900 mb-0.5">📚 {selectedMaterial?.title}</p>
        <p className="text-[11px] text-blue-700">{selectedMaterial?.description}</p>
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Judul Aktivitas</label>
        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Deskripsi Tambahan</label>
        <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none"></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Mulai</label>
          <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selesai</label>
          <input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
      </div>
      {renderSubmit("Simpan Aktivitas")}
    </form>
  );

  // --- EXAM FLOW ---
  const renderSelectExam = () => {
    let exams = referenceData.exams;
    if (searchExam) exams = exams.filter(e => e.title.toLowerCase().includes(searchExam.toLowerCase()));

    return (
      <div className="flex flex-col h-full">
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari exam / ujian..." value={searchExam} onChange={(e) => setSearchExam(e.target.value)} className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-3">
            {loadingRef ? <p className="text-xs text-center text-gray-400 py-4">Memuat data...</p> : 
             exams.length === 0 ? <p className="text-xs text-center text-gray-400 py-4 font-bold">Belum ada exam untuk mata pelajaran ini. Hubungi Admin.</p> :
             exams.map(exam => (
              <div key={exam.id} onClick={() => setSelectedExam(exam)} className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedExam?.id === exam.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-rose-300'}`}>
                <p className="text-sm font-bold text-gray-900 mb-1">{exam.title}</p>
                <p className="text-[11px] text-gray-500">{sessionInfo?.subject_name}</p>
                <div className="flex justify-between items-center mt-3 border-t border-dashed border-gray-300/50 pt-2">
                  <p className="text-[10px] font-black text-rose-600">{exam.total_questions || 0} Soal • {exam.duration} Menit</p>
                  <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedExam?.id === exam.id ? 'border-rose-500' : 'border-gray-300'}`}>
                    {selectedExam?.id === exam.id && <div className="w-2 h-2 bg-rose-500 rounded-full" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-between bg-white shrink-0">
          <button onClick={() => handleBack('SELECT_TYPE')} className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl">Batal</button>
          <button onClick={() => { setFormData({...formData, title: selectedExam?.title}); setStep('FORM_EXAM'); }} disabled={!selectedExam} className="px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl disabled:opacity-50">Lanjut →</button>
        </div>
      </div>
    );
  };

  const renderFormExam = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-4 text-center">
        <p className="text-sm font-black text-rose-900 mb-2">📝 {selectedExam?.title}</p>
        <div className="flex justify-center gap-4 text-xs font-bold text-rose-700 bg-white/60 py-2 rounded-lg border border-rose-100">
          <span>{selectedExam?.total_questions || 0} Soal</span>
          <span>•</span>
          <span>{selectedExam?.duration} Menit</span>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Judul Aktivitas</label>
        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Mulai</label>
          <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selesai</label>
          <input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
      </div>
      {renderSubmit("Hubungkan Exam")}
    </form>
  );

  // --- DISKUSI & REVIEW FLOW ---
  const renderFormDiscussion = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Judul Diskusi</label>
        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Cth: Diskusi Teks Eksplanasi" className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Pertanyaan / Instruksi</label>
        <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Apa fungsi utama teks eksplanasi?" className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none"></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Mulai</label><input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selesai</label><input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" /></div>
      </div>
      {renderSubmit("Simpan Aktivitas")}
    </form>
  );

  const renderFormReview = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Judul Review</label>
        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Cth: Review Materi Teks Eksplanasi" className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Materi yang Direview (Opsional)</label>
        <select value={formData.activityable_id} onChange={(e) => setFormData({...formData, activityable_id: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none bg-white focus:border-indigo-500">
          <option value="">-- Pilih Materi Sebelumnya --</option>
          {referenceData.curriculums.flatMap(c => c.materials || []).map(m => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Catatan</label>
        <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none"></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Mulai</label><input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" /></div>
        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selesai</label><input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500" /></div>
      </div>
      {renderSubmit("Simpan Aktivitas")}
    </form>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'SELECT_TYPE' && (
              <button onClick={() => {
                if(step === 'FORM_MATERIAL') handleBack('SELECT_MATERIAL');
                else if(step === 'FORM_EXAM') handleBack('SELECT_EXAM');
                else handleBack('SELECT_TYPE');
              }} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg"><ArrowLeft size={16}/></button>
            )}
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {step === 'SELECT_TYPE' ? 'Tambah Aktivitas' : 
               step === 'SELECT_MATERIAL' ? '📚 Materi Pembelajaran' : 
               step === 'SELECT_EXAM' ? '📝 Evaluasi / Exam' : 
               step === 'FORM_MATERIAL' ? 'Form Materi' : 
               step === 'FORM_EXAM' ? 'Form Exam' : 
               `Form ${activityType}`}
            </h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-1.5 rounded-lg"><X size={18}/></button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {step === 'SELECT_TYPE' && renderSelectType()}
          {step === 'SELECT_MATERIAL' && renderSelectMaterial()}
          {step === 'FORM_MATERIAL' && renderFormMaterial()}
          {step === 'SELECT_EXAM' && renderSelectExam()}
          {step === 'FORM_EXAM' && renderFormExam()}
          {step === 'FORM_DISCUSSION' && renderFormDiscussion()}
          {step === 'FORM_REVIEW' && renderFormReview()}
        </div>
      </div>
    </div>
  );
}