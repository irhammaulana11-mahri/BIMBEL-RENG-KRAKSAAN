import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldAlert, Lock, ArrowLeft, EyeOff } from "lucide-react";

export default function DocumentPreviewPage() {
  const [searchParams] = useSearchParams();
  const fileUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Dokumen Pembelajaran";
  const userName = searchParams.get("user") || "Siswa Bimbel Reng Kraksaan";

  const [devToolsDetected, setDevToolsDetected] = useState(false);
  const [accessTime] = useState(() => new Date().toLocaleString("id-ID"));

  useEffect(() => {
    // 🔴 1. DETEKSI DEVELOPER TOOLS / INSPECT ELEMENT
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        setDevToolsDetected(true);
      }
    };

    const interval = setInterval(detectDevTools, 1000);

    // 🔴 2. BLOKIR KLIK KANAN
    const handleContextMenu = (e) => e.preventDefault();

    // 🔴 3. BLOKIR SHORTCUTS KEYBOARD KETAT
    const blockedKeys = ["p", "s", "c", "u", "a"];
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Ctrl + [P, S, C, U, A]
      if (e.ctrlKey && blockedKeys.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        alert("Aksi ini tidak diizinkan! Dokumen terlindungi.");
        return;
      }

      // Ctrl + Shift + [I, J, C]
      if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
      }

      // PrintScreen (Clear Clipboard)
      if (e.key === "PrintScreen") {
        e.preventDefault();
        if (navigator.clipboard) {
          navigator.clipboard.writeText("");
        }
        alert("Tangkapan layar tidak diizinkan!");
      }
    };

    // 🔴 4. BLOKIR DRAG & DROP
    const handleDrag = (e) => e.preventDefault();

    // 🔴 5. BLOKIR SELEKSI TEKS
    const handleSelect = (e) => e.preventDefault();

    // Register Listeners
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dragstart", handleDrag);
    window.addEventListener("drop", handleDrag);
    window.addEventListener("selectstart", handleSelect);

    return () => {
      clearInterval(interval);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dragstart", handleDrag);
      window.removeEventListener("drop", handleDrag);
      window.removeEventListener("selectstart", handleSelect);
    };
  }, []);

  // Tampilan Terkunci jika Inspect/DevTools Dibuka
  if (devToolsDetected) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white font-sans p-6 text-center select-none">
        <div className="p-4 bg-red-500/10 text-red-400 rounded-3xl mb-4 border border-red-500/20 animate-pulse">
          <EyeOff size={48} />
        </div>
        <h1 className="text-xl font-black text-red-400">Inspeksi Pengembang Terdeteksi</h1>
        <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
          Sistem mendeteksi aktivitas Developer Tools / Inspect Element. Untuk alasan keamanan hak cipta materi, akses dokumen dihentikan.
        </p>
        <button
          onClick={() => window.close()}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
        >
          Tutup Halaman Ini
        </button>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
        <p className="text-sm font-bold text-red-400">URL Berkas tidak ditemukan atau tidak valid.</p>
      </div>
    );
  }

  // Parameter `#toolbar=0` untuk menyembunyikan bilah tombol unduh PDF Chrome
  const securePdfUrl = `${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 select-none overflow-hidden relative">
      {/* 🔴 CSS PROTEKSI KHUSUS */}
      <style>{`
        * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        iframe {
          user-select: none !important;
          pointer-events: auto;
        }

        /* Tampilan disembunyikan total jika dipaksa Cetak (Ctrl+P) */
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Bar Viewer */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.close()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            title="Tutup Tab"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
            <Lock size={18} />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-100">{title}</h1>
            <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
              <ShieldAlert size={12} /> Protected Mode (Print, Copy & Download Disabled)
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
          User: {userName}
        </div>
      </div>

      {/* Kontainer Viewer dengan Watermark Layer */}
      <div className="flex-1 w-full h-full relative bg-slate-900">
        
        {/* 🟢 DYNAMIC WATERMARK OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.12] overflow-hidden select-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="text-slate-100 text-lg sm:text-2xl font-black uppercase tracking-widest -rotate-12 whitespace-nowrap"
            >
              BIMBEL RENG KRAKSAAN • {userName} • {accessTime}
            </div>
          ))}
        </div>

        {/* Frame PDF Viewer */}
        <iframe
          src={securePdfUrl}
          className="w-full h-full border-0 relative z-0"
          title="Protected Document Viewer"
        />
      </div>
    </div>
  );
}