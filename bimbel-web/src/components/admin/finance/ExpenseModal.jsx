import React, { useState } from "react";
import { X, Landmark } from "lucide-react";

export default function ExpenseModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "ATK & Modul",
    title: "",
    amount: "",
    note: ""
  });

  if (!open) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, amount: parseInt(formData.amount) });
    setFormData({ date: new Date().toISOString().split('T')[0], category: "ATK & Modul", title: "", amount: "", note: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <Landmark className="w-5 h-5 text-red-500" /> Catat Kas Keluar Operasional
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Pastikan nominal sesuai nota fisik pembukuan kas kecil</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori Biaya</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white text-sm">
                <option value="Sewa & Gedung">Sewa & Gedung</option>
                <option value="ATK & Modul">ATK & Modul</option>
                <option value="Pemasaran">Pemasaran (Brosur/Iklan)</option>
                <option value="Listrik & Internet">Listrik & Internet</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama / Keterangan Biaya</label>
            <input
              type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Contoh: Bayar Wi-Fi Indihome Ruko Pusat"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal Pengeluaran (Rp)</label>
            <input
              type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono" placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="w-full rounded-xl border px-3 py-2 text-xs h-16 resize-none" placeholder="Toko ATK Makmur Jaya, no nota..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Batal</button>
            <button type="submit" className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-xs">Simpan Kas Keluar</button>
          </div>
        </form>
      </div>
    </div>
  );
}