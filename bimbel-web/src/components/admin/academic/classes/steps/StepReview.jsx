import React from "react";

export default function StepReview({ formData, packages = [], locations = [] }) {
  const selectedPackage = packages.find((p) => String(p.id) === String(formData.package_id));
  const selectedLocation = locations.find((l) => String(l.id) === String(formData.learning_location_id));

  return (
    <div className="space-y-4 animate-in fade-in duration-200 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
      <h3 className="font-black text-gray-900 border-b pb-2 uppercase tracking-wider text-[11px]">Dashboard Ringkasan Konfigurasi</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <span className="text-gray-400 font-bold block">Kode & Nama:</span> 
          <strong className="text-gray-900 block font-mono">{formData.code} - {formData.name}</strong>
        </div>
        <div>
          <span className="text-gray-400 font-bold block">Package:</span> 
          <strong className="text-gray-900 block">{selectedPackage?.package_name || "-"}</strong>
        </div>
        <div>
          <span className="text-gray-400 font-bold block">Jenis / Level:</span> 
          <strong className="text-gray-900 block">{formData.class_type} ({formData.education_level || "-"})</strong>
        </div>
        <div>
          <span className="text-gray-400 font-bold block">Lokasi Cabang:</span> 
          <strong className="text-gray-900 block">{selectedLocation?.location_name || "-"}</strong>
        </div>
        <div>
          <span className="text-gray-400 font-bold block">Meeting & Durasi:</span> 
          <strong className="text-gray-900 block font-mono">{formData.meeting_per_month} Sesi / {formData.duration_minutes}m</strong>
        </div>
        <div>
          <span className="text-gray-400 font-bold block">Kapasitas Kuota:</span> 
          <strong className="text-blue-600 block font-mono font-black">{formData.student_ids.length} / {formData.max_students} Siswa</strong>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 space-y-1">
        <span className="text-gray-400 font-bold block mb-1">Mata Pelajaran & Tentor Plotting:</span>
        {formData.subjects && formData.subjects.length > 0 ? (
          formData.subjects.map((s, i) => {
            // 🟢 Langsung mengambil tentor_name yang sudah disimpan dari Step 3
            const tentorName = s.tentor_name || "Belum Diplot";
            
            return (
              <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0 font-medium">
                <span>✓ {s.subject_name}</span>
                <strong className={`font-bold ${s.tentor_id ? "text-purple-700" : "text-amber-600"}`}>
                  {tentorName}
                </strong>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 italic py-2">Belum ada mata pelajaran yang dipilih.</div>
        )}
      </div>
    </div>
  );
}