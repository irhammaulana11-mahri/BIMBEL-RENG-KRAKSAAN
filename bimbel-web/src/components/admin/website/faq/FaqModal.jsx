import React, { useEffect, useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { createFaq, updateFaq } from "@/services/admin/website/faqService";
import FaqForm from "./FaqForm";
import FaqPreview from "./FaqPreview";

export default function FaqModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    sort_order: 1,
    is_active: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        question: data.question || "",
        answer: data.answer || "",
        sort_order: data.sort_order || 1,
        is_active: data.is_active ?? true,
      });
    } else {
      setForm({
        question: "",
        answer: "",
        sort_order: 1,
        is_active: true,
      });
    }
  }, [data, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (data) {
        await updateFaq(data.id, form);
      } else {
        await createFaq(form);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
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
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {data ? "Koreksi Tanya Jawab FAQ" : "Registrasi Item FAQ Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Susun rilis informasi jawaban atas pertanyaan berulang wali murid secara terstruktur.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pembagian Grid Responsif Kiri Form Kani Live Preview Sticky */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <FaqForm form={form} setForm={setForm} />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-start">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Live View Accordion Preview</span>
              <div className="sticky top-2">
                <FaqPreview form={form} />
              </div>
            </div>
          </div>

          {/* Footer Sticky Tombol Kerja Akhir */}
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
              {loading ? "Menyimpan Data..." : "Terbitkan Informasi FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}