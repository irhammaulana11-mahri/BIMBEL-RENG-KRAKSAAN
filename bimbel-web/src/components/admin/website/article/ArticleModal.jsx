import React, { useEffect, useState } from "react";
import { X, FileEdit } from "lucide-react";
import { createArticle, updateArticle } from "../../../../services/articleService";
import { uploadImage } from "../../../../services/uploadService";
import ArticleForm from "./ArticleForm";

export default function ArticleModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    categories: [],
    featured_image: "",
    publish_date: "",
    is_published: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        summary: data.summary || "",
        content: data.content || "",
        publish_date: data.publish_date || "",
        featured_image: data.featured_image || "",
        categories: data.categories?.map((item) => item.id) || [],
        is_published: data.is_published ?? true,
      });
      if (data.featured_image) {
        setPreview(`http://127.0.0.1:8001${data.featured_image}`);
      }
    } else {
      setForm({ title: "", summary: "", content: "", categories: [], featured_image: "", publish_date: "", is_published: true });
      setPreview(null);
      setImageFile(null);
    }
  }, [data, open]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let payload = { ...form };
      if (imageFile) {
        const upload = await uploadImage(imageFile);
        payload.featured_image = upload;
      }

      if (data?.id) {
        await updateArticle(data.id, payload);
      } else {
        await createArticle(payload);
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
      <div className="w-full max-w-7xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto duration-200 animate-in zoom-in-95">
        
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex items-start gap-2.5 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">{data ? "Koreksi Naskah Artikel" : "Tulis Artikel Baru"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Susun rilis berita, artikel tips akademik, dan kaitkan dengan tag kategori yang relevan.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ArticleForm form={form} setForm={setForm} preview={preview} handleImage={handleImage} />
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors disabled:opacity-50">
              {loading ? "Menyimpan Data..." : "Terbitkan Artikel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}