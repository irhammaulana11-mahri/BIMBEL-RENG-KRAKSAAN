import React, { useState } from "react";
import { X, Check, XCircle, FileText, Image as ImageIcon } from "lucide-react";

export default function VerificationModal({ open, onClose, data, onConfirm }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!open || !data) return null;

  const handleApprove = () => {
    onConfirm(data.id, "approved", "");
    onClose();
  };

  const handleReject = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return alert("Alasan reject wajib diisi!");
    onConfirm(data.id, "rejected", rejectReason);
    setRejectMode(false);
    setRejectReason("");
    onClose();
  };

  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={() => { setRejectMode(false); onClose(); }} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-4">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
            Validasi Bukti Bayar
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Konfirmasi Pembayaran</h2>
          <p className="text-xs text-gray-400 mt-0.5">Wali Murid: <strong className="text-gray-600">{data.parent_name}</strong></p>
        </div>

        <div className="space-y-4">
          {/* Rincian Ringkas nominal */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
            <p>Siswa: <span className="font-semibold text-gray-800">{data.student_name}</span></p>
            <p>Total Tagihan: <span className="font-semibold text-gray-800">{formatIDR(data.calculated_bill)}</span></p>
          </div>

          {/* Bukti Foto Gambar yang Diupload Orang Tua */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Foto Bukti Transfer Orang Tua
            </label>
            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-100 flex justify-center items-center h-56 max-h-56 relative group">
              {data.proof_image ? (
                <img src={data.proof_image} alt="Bukti Bayar" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4 text-gray-400 text-xs">
                  <p>Gambar dummy simulasi struk transfer.png</p>
                  <p className="text-[10px] mt-1 text-gray-300">(Data `proof_image` API kosongi)</p>
                </div>
              )}
            </div>
          </div>

          {/* Keterangan / Catatan Orang Tua */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Keterangan Wali Murid
            </label>
            <p className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-100 italic">
              "{data.parent_note || "Tidak ada catatan keterangan."}"
            </p>
          </div>

          {/* Mode Aksi Approval / Form Penolakan */}
          {!rejectMode ? (
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRejectMode(true)}
                className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Tolak / Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="w-full py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" /> Setujui (Approve)
              </button>
            </div>
          ) : (
            <form onSubmit={handleReject} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-red-800 mb-1">Alasan Penolakan (Reject Keterangan)</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-red-200 bg-white p-2.5 text-xs h-16 resize-none focus:outline-none focus:border-red-500"
                  placeholder="Contoh: Nominal transfer kurang, atau foto struk tidak terbaca/terpotong..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setRejectMode(false)} className="px-3 py-1.5 bg-gray-200 rounded-lg text-xs font-medium text-gray-600">Batal</button>
                <button type="submit" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">Kirim Penolakan</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}