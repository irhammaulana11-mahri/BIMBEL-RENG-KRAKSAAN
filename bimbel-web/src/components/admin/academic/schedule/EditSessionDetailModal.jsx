import React, { useState, useEffect } from "react";
import { X, FileText, Check } from "lucide-react";
import { updateSessionDetails } from "@/services/academic/scheduleService";
import { useToast } from "@/hooks/useToast";

export default function EditSessionDetailModal({ open, session, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    meeting_url: "",
    room_name: "",
    note: ""
  });

  useEffect(() => {
    if (open && session) {
      setFormData({
        meeting_url: session.meeting_url || "",
        room_name: session.room_name || "",
        note: session.note || ""
      });
    }
  }, [open, session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateSessionDetails(session.id, formData);
      showSuccess("Detail sesi berhasil diperbarui.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Gagal memperbarui detail sesi.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Edit Detail Sesi</h3>
              <p className="text-xs font-medium text-gray-500">Perbarui URL, lokasi, atau catatan operasional.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {session.class_type === "ONLINE" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Meeting URL</label>
              <input 
                type="url" 
                value={formData.meeting_url}
                onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi / Ruangan</label>
            <input 
              type="text" 
              value={formData.room_name}
              onChange={(e) => setFormData({...formData, room_name: e.target.value})}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Cth: Gedung A / Ruang 101"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea 
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              placeholder="Catatan untuk sesi ini..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : <><Check size={14} /> Simpan Perubahan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}