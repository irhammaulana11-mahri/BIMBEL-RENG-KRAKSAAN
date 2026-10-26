import React, { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import api from "../../api/axios";

export default function FileDropzone({ value, onChange, accept = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg", folder = "modules" }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      setUploading(true);
      setFileName(file.name);
      const response = await api.post("/uploads/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        onChange(response.data.data.url); // Menyimpan URL berkas yang diunggah
      }
    } catch (error) {
      console.error("Gagal mengunggah berkas", error);
      alert("Gagal mengunggah berkas. Pastikan ukuran file maks 20MB.");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      {!value ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-gray-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-gray-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-gray-700">Mengunggah {fileName}...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-2xs border border-gray-100">
                <Upload size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Drag & Drop berkas di sini, atau <span className="text-blue-600 underline">Pilih File</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Mendukung PDF, DOCX, PPTX, MP4, atau Gambar (Maks 20MB)</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tampilan Berkas Terunggah */
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-emerald-900 truncate">Berkas Berhasil Diunggah</p>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-emerald-600 hover:underline truncate block"
              >
                {value}
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Ganti Berkas"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}