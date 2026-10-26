import React, { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Upload, CreditCard } from "lucide-react";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

export default function ParentBillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/parent/invoices");
      setInvoices(res.data?.data || res.data || []);
    } catch (err) {
      showError("Gagal mengambil riwayat invoice tagihan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  const handleFileChange = async (e, invoiceId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran berkas frontend (Maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError("Berkas terlalu besar. Maksimal batas unggah file bukti transfer adalah 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt_image", file);

    try {
      setUploadingId(invoiceId);
      hideToast();
      
      // Kirim multipart/form-data ke backend endpoint pembukuan admin
      await api.post(`/parent/invoices/${invoiceId}/upload-receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      showSuccess("Bukti transfer berhasil diunggah! Sistem sedang melakukan verifikasi rekonsiliasi ke bagian keuangan.");
      loadInvoices();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mengunggah bukti transaksi.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <Toast {...toast} onClose={hideToast} />

      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Tagihan & Riwayat</h1>
        <p className="text-base text-gray-500 mt-1">Pantau status iuran bulanan berkala, unduh kwitansi digital, dan unggah konfirmasi transaksi.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-gray-600 whitespace-nowrap">
                <th className="px-6 py-4.5">Nomor Invoice</th>
                <th className="px-6 py-4.5">Deskripsi Paket</th>
                <th className="px-6 py-4.5 text-center">Jatuh Tempo</th>
                <th className="px-6 py-4.5 text-right">Total Tagihan</th>
                <th className="px-6 py-4.5 text-center w-36">Status</th>
                <th className="px-6 py-4.5 text-center w-48">Aksi Konfirmasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                    Belum ditemukan adanya catatan riwayat transaksi tagihan administrasi.
                  </td>
                </tr>
              )}

              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">{invoice.invoice_number}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                      <CreditCard size={16} className="text-gray-400" />
                      {invoice.title || `Bulan Bimbingan Paket`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-gray-500">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-950">
                    {invoice.amount_formatted || `Rp ${Number(invoice.amount).toLocaleString("id-ID")}`}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {invoice.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                          <CheckCircle size={12} /> Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100">
                          <Clock size={12} /> Belum Lunas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {invoice.status !== "PAID" ? (
                        <label className={`relative cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all
                          ${uploadingId === invoice.id 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" 
                            : "bg-blue-50 text-blue-600 border-blue-200/50 hover:bg-blue-100"}`}
                        >
                          <Upload size={14} />
                          {uploadingId === invoice.id ? "Mengunggah..." : "Upload Bukti"}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={uploadingId === invoice.id}
                            onChange={(e) => handleFileChange(e, invoice.id)}
                          />
                        </label>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Transaksi Selesai</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}