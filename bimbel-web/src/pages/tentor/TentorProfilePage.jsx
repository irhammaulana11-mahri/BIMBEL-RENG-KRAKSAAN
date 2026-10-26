import React from "react";

export default function TentorProfilePage() {
  return (
    <div className="space-y-6 animate-in fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Profil Tentor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informasi akun dan spesialisasi mengajar Anda.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-2xl font-black">DW</div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Dewi Wulan, S.Pd.</h3>
            <p className="text-xs font-bold text-indigo-600">Spesialisasi: IPS & Sejarah</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
          <div><p className="text-gray-400">Email:</p><p className="text-gray-800 font-bold">dewi.wulan@bimbel.test</p></div>
          <div><p className="text-gray-400">No. WhatsApp:</p><p className="text-gray-800 font-bold">081234567890</p></div>
        </div>
      </div>
    </div>
  );
}