import React from "react";
import { AlertTriangle,CheckCircle2,X,} from "lucide-react";

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin ingin melanjutkan?",
  confirmText = "Ya",
  cancelText = "Batal",
  loading = false,
  variant = "primary",
}) {
  if (!open) return null;

  const variantConfig = {
    primary: {
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: AlertTriangle,
    },

    success: {
      button: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      icon: CheckCircle2,
    },

    warning: {
      button: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: AlertTriangle,
    },

    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      icon: AlertTriangle,
    },
  };

  const current = variantConfig[variant] ?? variantConfig.primary;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 p-6 relative animate-in zoom-in-95">
        <button onClick={onClose} disabled={loading} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className={`p-3 rounded-2xl mb-4 ${current.iconBg}`}>
            <Icon className={`w-6 h-6 ${current.iconColor}`}/>
          </div>

          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} disabled={loading} className="flex-1 rounded-xl bg-gray-100 py-2.5 font-bold text-gray-600 hover:bg-gray-200">
            {cancelText}
          </button>

          <button onClick={onConfirm} disabled={loading} className={`flex-1 rounded-xl py-2.5 font-bold ${current.button}`}>
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// import React from "react";
// import { AlertTriangle, X } from "lucide-react";


// export default function ConfirmationModal({ 
//   open, 
//   onClose, 
//   onConfirm, 
//   title = "Konfirmasi Aksi", 
//   message = "Apakah Anda yakin ingin melanjutkan aksi ini?", 
//   confirmText = "Ya, Lanjutkan", 
//   cancelText = "Batal",
//   loading = false,
//   variant = "primary" // 'primary' (blue), 'danger' (red), 'warning' (amber)
// }) {
//   if (!open) return null;

//   // Menentukan skema warna tombol berdasarkan varian aksi
//   const variantStyles = {
//     primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
//     success: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
//     danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
//     warning: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white",
//   };

//   const iconStyles = {
//     primary: "bg-blue-50 text-blue-600",
//     success: "bg-green-50 text-green-600",
//     danger: "bg-red-50 text-red-600",
//     warning: "bg-amber-50 text-amber-600",
//   };

//   return (
//     <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 duration-200 animate-in fade-in">
//       <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-gray-100 duration-200 animate-in zoom-in-95">
        
//         {/* Tombol X Pojok Kanan Atas */}
//         <button 
//           type="button" 
//           disabled={loading}
//           onClick={onClose} 
//           className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
//         >
//           <X className="w-4 h-4" />
//         </button>

//         {/* Konten Utama */}
//         <div className="flex flex-col items-center text-center mt-2">
//           {/* Lingkaran Ikon Aksen */}
//           <div className={`p-3.5 rounded-2xl mb-4 shrink-0 ${iconStyles[variant]}`}>
//             <AlertTriangle className="w-6 h-6" />
//           </div>

//           <div className="space-y-2">
//             <h3 className="text-xl font-black text-gray-950 tracking-tight">
//               {title}
//             </h3>
//             <p className="text-sm text-gray-500 font-medium leading-relaxed">
//               {message}
//             </p>
//           </div>
//         </div>

//         {/* Aksi Tombol Pilihan */}
//         <div className="mt-6 flex gap-3 border-t border-gray-50 pt-4">
//           <button
//             type="button"
//             disabled={loading}
//             onClick={onClose}
//             className="w-1/2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-colors focus:outline-none"
//           >
//             {cancelText}
//           </button>
          
//           <button
//             type="button"
//             disabled={loading}
//             onClick={onConfirm}
//             className={`w-1/2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors focus:outline-none ${variantStyles[variant]}`}
//           >
//             {loading ? "Memproses..." : confirmText}
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// }