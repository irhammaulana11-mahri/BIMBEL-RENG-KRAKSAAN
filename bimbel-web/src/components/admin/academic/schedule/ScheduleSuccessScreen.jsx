import React from "react";
import { Check, Clock, BookOpen, User, Plus } from "lucide-react";

export default function ScheduleSuccessScreen({
  selectedClassObj,
  formData,
  subjectList,
  tentorList,
  onClose,
  onCreateAnother,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-5 text-center animate-in slide-in-from-bottom-4">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
        <Check size={32} strokeWidth={3} />
      </div>

      <div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          Satu Slot Jadwal Berhasil Disimpan!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Agenda belajar untuk{" "}
          <strong className="text-gray-800">{selectedClassObj?.name}</strong> telah ditambahkan ke kalender.
        </p>
      </div>

      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2 text-sm shadow-inner">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock size={16} className="text-blue-500" />
          <span className="font-bold">{formData.day_of_week}</span>
          <span className="font-mono bg-white px-1.5 border rounded">
            {formData.start_time} - {formData.end_time}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <BookOpen size={16} className="text-purple-500" />
          <span className="font-semibold">
            {subjectList.find((s) => String(s.id) === formData.subject_id)?.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <User size={16} className="text-amber-500" />
          <span>
            {tentorList.find((t) => String(t.id) === formData.tentor_id)?.user?.name}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-medium">
        Apakah Anda ingin mem-plot jadwal mapel lain untuk kelas ini?
      </p>

      <div className="w-full flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold text-sm rounded-xl cursor-pointer transition-colors"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={onCreateAnother}
          className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-700 font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Plus size={16} /> Tambah Slot Lain
        </button>
      </div>
    </div>
  );
}