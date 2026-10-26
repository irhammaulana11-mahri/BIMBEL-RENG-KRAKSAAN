import React, { useEffect, useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { createBanner, updateBanner } from "../../../../services/bannerService";
import { uploadImage } from "../../../../services/uploadService";
import BannerForm from "./BannerForm";

export default function BannerModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    button_text: "",
    button_link: "",
    sort_order: 1,
    is_active: true,
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        subtitle: data.subtitle || "",
        image_url: data.image_url || "",
        button_text: data.button_text || "",
        button_link: data.button_link || "",
        sort_order: data.sort_order || 1,
        is_active: data.is_active ?? true,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
      });
      if (data.image_url) {
        setPreview(`http://127.0.0.1:8001${data.image_url}`);
      }
    } else {
      setForm({
        title: "",
        subtitle: "",
        image_url: "",
        button_text: "",
        button_link: "",
        sort_order: 1,
        is_active: true,
        start_date: "",
        end_date: "",
      });
      setPreview(null);
      setBannerFile(null);
    }
  }, [data, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let payload = { ...form };
      if (bannerFile) {
        const imageUrl = await uploadImage(bannerFile);
        payload.image_url = imageUrl;
      }

      if (data?.id) {
        await updateBanner(data.id, payload);
      } else {
        await createBanner(payload);
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
      <div className="w-full max-w-5xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        {/* Tombol Close Pojok Kanan Atas */}
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-5 flex items-start gap-2.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <ImagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {data ? "Koreksi Materi Visual Banner" : "Registrasi Banner Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sesuaikan informasi konten promosi, tautan tombol aksi, dan urutan tayang slide.
            </p>
          </div>
        </div>

        {/* Konten Formulir */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-sm">
            <BannerForm 
              form={form} 
              setForm={setForm} 
              preview={preview} 
              handleImage={handleImage}
            />
          </div>

          {/* Bar Tombol Aksi Kerja Akhir */}
          <div className="pt-2 border-t border-gray-150 flex justify-end gap-3 bg-white">
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
              {loading ? "Sedang Menyimpan..." : "Kunci Publikasi Banner"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}