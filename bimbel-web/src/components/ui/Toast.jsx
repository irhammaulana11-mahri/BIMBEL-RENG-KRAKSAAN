import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Toast({ show, message, type, onClose, duration = 5000 }) {
  // Efek auto-close jika waktu durasi habis
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[99999] max-w-sm w-full animate-in fade-in slide-in-from-top-5 duration-300">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md bg-white/95 ${
        type === "success" 
          ? "border-emerald-200 text-emerald-800 shadow-emerald-500/5" 
          : "border-red-200 text-red-800 shadow-red-500/5"
      }`}>
        {/* Render Ikon Sesuai Tipe */}
        {type === "success" ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-black tracking-tight leading-none">
            {type === "success" ? "Berhasil" : "Terjadi Kesalahan"}
          </p>
          <p className="text-xs opacity-90 mt-1 font-semibold leading-relaxed">{message}</p>
        </div>

        {/* Tombol Tutup Manual */}
        <button 
          type="button" 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}