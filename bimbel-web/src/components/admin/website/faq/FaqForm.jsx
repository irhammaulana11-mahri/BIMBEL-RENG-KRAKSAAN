import React from "react";

export default function FaqForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Inti Judul Pertanyaan FAQ</label>
        <input 
          type="text" 
          required
          value={form.question} 
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          placeholder="Contoh: Apakah bisa mengajukan perubahan jam belajar privat?"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Deskripsi Penjelasan Jawaban</label>
        <textarea 
          rows={6} 
          required
          value={form.answer} 
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500"
          placeholder="Tuliskan jawaban komprehensif mengenai kebijakan operasional terkait..."
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nomor Urutan Tampil (Sort Order)</label>
        <input 
          type="number" 
          required
          value={form.sort_order} 
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
          placeholder="Contoh: 1"
        />
      </div>

      <div className="pt-1">
        <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={form.is_active} 
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Aktifkan Pertanyaan (Tampilkan Langsung di Halaman Bantuan Website)
        </label>
      </div>
    </div>
  );
}