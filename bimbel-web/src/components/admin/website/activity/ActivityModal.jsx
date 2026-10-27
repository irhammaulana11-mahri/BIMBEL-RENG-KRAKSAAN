import React, { useEffect, useState } from "react";
import { X, CalendarDays } from "lucide-react";
import { createActivities, updateActivities } from "@/services/admin/website/activityService";
import { uploadImage } from "@/services/admin/website/uploadService";
import ActivityForm from "./ActivityForm";

export default function ActivityModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    activity_date: "",
    location: "",
    cover_image: "",
    is_active: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        activity_date: data.activity_date || "",
        location: data.location || "",
        cover_image: data.cover_image || "",
        is_active: data.is_active ?? true,
      });
      if (data.cover_image) {
        setPreview(`http://127.0.0.1:8001${data.cover_image}`);
      }
    } else {
      setForm({
        title: "",
        description: "",
        activity_date: "",
        location: "",
        cover_image: "",
        is_active: true,
      });
      setPreview(null);
      setCoverFile(null);
    }
  }, [data, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let payload = { ...form };
      if (coverFile) {
        const imageUrl = await uploadImage(coverFile);
        payload.cover_image = imageUrl;
      }

      if (data?.id) {
        await updateActivities(data.id, payload);
      } else {
        await createActivities(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex items-start gap-2.5 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {data ? "Koreksi Berita & Kegiatan" : "Registrasi Agenda Kegiatan Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Sediakan informasi publikasi kegiatan internal cabang atau dokumentasi klasikal.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ActivityForm 
            form={form} 
            setForm={setForm} 
            preview={preview} 
            handleImage={handleImage} 
            activityFile={coverFile} 
          />
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan Berkas..." : "Terbitkan Dokumentasi"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}