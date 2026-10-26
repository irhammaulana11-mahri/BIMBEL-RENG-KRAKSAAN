import React, { useEffect, useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";
import TestimonialForm from "./TestimonialForm";
import { uploadImage } from "../../../../services/uploadService";
import { createTestimonial, updateTestimonial } from "../../../../services/testimonialService";

export default function TestimonialModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [testimonialFile, setTestimonialFile] = useState(null);
  const [form, setForm] = useState({
    student_name: "",
    school_name: "",
    testimonial: "",
    photo_url: "",
    rating: 5,
    is_active: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        student_name: data.student_name || "",
        school_name: data.school_name || "",
        testimonial: data.testimonial || "",
        photo_url: data.photo_url || "",
        rating: data.rating || 5,
        is_active: data.is_active ?? true,
      });
      if (data.photo_url) {
        setPreview(`http://127.0.0.1:8001${data.photo_url}`);
      }
    } else {
      setForm({
        student_name: "",
        school_name: "",
        testimonial: "",
        photo_url: "",
        rating: 5,
        is_active: true,
      });
      setPreview("");
      setTestimonialFile(null);
    }
  }, [data, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTestimonialFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let payload = { ...form };
      if (testimonialFile) {
        const imageUrl = await uploadImage(testimonialFile);
        payload.photo_url = imageUrl;
      }

      if (data?.id) {
        await updateTestimonial(data.id, payload);
      } else {
        await createTestimonial(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        {/* Tombol Tutup */}
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-5 flex items-start gap-2.5 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {data ? "Koreksi Ulasan Siswa" : "Registrasi Testimoni Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Catat ulasan kepuasan belajar alumni untuk dipajang pada banner ulasan publik.</p>
          </div>
        </div>

        {/* Form Tubuh */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <TestimonialForm 
            form={form} 
            setForm={setForm} 
            handleImage={handleImage} 
            preview={preview}
            testimonialFile={testimonialFile}
          />

          {/* Footer Sticky Tombol Aksi */}
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
              {loading ? "Menyimpan Data..." : "Terbitkan Apresiasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}