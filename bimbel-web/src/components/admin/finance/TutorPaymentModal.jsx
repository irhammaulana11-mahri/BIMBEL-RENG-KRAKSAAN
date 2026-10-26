import React, { useEffect, useState } from "react";
import { X, Landmark } from "lucide-react";

export default function TutorPaymentModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    source_bank: "",
    transfer_reference: "",
    transfer_date: new Date().toISOString().split('T')[0], // Default tanggal hari ini
  });

  useEffect(() => {
    if (open) {
      setFormData({ source_bank: "", transfer_reference: "", transfer_date: new Date().toISOString().split('T')[0] });
    }
  }, [open]);

  if (!open || !data) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data.id, formData);
  };

  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Landmark className="w-5 h-5 text-blue-600" /> Catat Transfer Payroll
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Gaji Mengajar: <span className="font-bold text-gray-700">{data.tutor_name}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex justify-between items-center">
            <span className="font-medium">Total Nominal Transfer:</span>
            <strong className="text-sm font-mono">{formatIDR(data.calculated_salary)}</strong>
          </div>

          {/* Bank Sumber */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Sumber Dana Transfer</label>
            <select
              required
              value={formData.source_bank}
              onChange={(e) => setFormData({...formData, source_bank: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 bg-white text-sm"
            >
              <option value="">Pilih Rekening Kas Bimbel</option>
              <option value="BCA - Rek Utama Bimbel">BCA (Rekening Utama Bimbel)</option>
              <option value="Mandiri - Operasional">Mandiri (Kas Operasional)</option>
              <option value="BRI - Yayasan">BRI (Kas Yayasan)</option>
            </select>
          </div>

          {/* No. Referensi */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Referensi / Resi Transfer</label>
            <input
              type="text"
              required
              value={formData.transfer_reference}
              onChange={(e) => setFormData({...formData, transfer_reference: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
              placeholder="Contoh: REF819238129"
            />
          </div>

          {/* Tanggal Transfer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Eksekusi Transfer</label>
            <input
              type="date"
              required
              value={formData.transfer_date}
              onChange={(e) => setFormData({...formData, transfer_date: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Batal</button>
            <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-blue-700">
              {loading ? "Menyimpan..." : "Konfirmasi Selesai Bayar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}