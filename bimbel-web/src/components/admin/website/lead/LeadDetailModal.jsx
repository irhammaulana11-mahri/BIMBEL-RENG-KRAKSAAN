import { useEffect, useState } from "react";
import { Phone, GraduationCap, Package, User, UserCheck, MessageCircle } from "lucide-react";
import { updateLead, convertLead } from "../../../../services/admin/leadService";

// Impor internal LeadStatusBadge (opsional jika ingin disatukan atau dibiarkan)
import LeadStatusBadge from "../../../../components/admin/website/lead/LeadStatusBadge";

// Impor reusable komponen & hook toast
import Toast from "../../../ui/Toast";
import { useToast } from "../../../../hooks/useToast";

export default function LeadDetailModal({ open, onClose, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("NEW");
  
  // Mengaktifkan custom hook toast di level komponen modal
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (data) {
      setStatus(data.status || "NEW");
    }
  }, [data]);

  if (!open || !data) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      hideToast();
      
      const response = await updateLead(data.id, { ...data, status });
      
      // Mengirim trigger sukses
      showSuccess(response.data?.message || "Status pengajuan lead berhasil diperbarui.");
      
      // Beri jeda sedikit agar user sempat membaca Toast sebelum modal menutup
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
      
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Gagal memperbarui status data lead.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    // Validasi pencegahan di sisi frontend browser
    if (status !== "CONTACTED") {
      showError("Lead harus berstatus CONTACTED terlebih dahulu sebelum konversi akun.");
      return;
    }

    const confirmConvert = window.confirm("Konversi lead menjadi akun resmi parent?");
    if (!confirmConvert) return;

    try {
      setLoading(true);
      hideToast();
      
      const response = await convertLead(data.id);
      const tempPassword = response.data?.temporary_password;
      
      showSuccess(`Aktivasi Berhasil! Akun login ortu dibuat. Password: ${tempPassword}`);
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || "Gagal mengonversi status akun lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      
      {/* ================= PERBAIKAN: PASANG ELEMENT LAYER TOAST DI SINI ================= */}
      <Toast {...toast} onClose={hideToast} />
      {/* ================================================================================= */}

      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-black text-gray-950 tracking-tight">Detail Lead Admission</h2>
            <p className="text-sm text-slate-500 mt-0.5">Informasi berkas pengajuan calon siswa</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-bold focus:outline-none">✕</button>
        </div>
        
        {/* STATUS INFO HEAD */}
        <div className="flex justify-between items-center bg-slate-50/80 rounded-xl p-4 my-4 border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status Saat Ini</p>
            <LeadStatusBadge status={data.status}/>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal Masuk</p>
            <p className="font-mono text-sm font-bold text-slate-700">{new Date(data.created_at).toLocaleDateString("id-ID")}</p>
          </div>
        </div>

        {/* BODY SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <User size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Orang Tua / Wali</span>
            </div>
            <p className="text-base font-bold text-gray-900">{data.parent_name}</p>
          </div>

          <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <UserCheck size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Nama Calon Siswa</span>
            </div>
            <p className="text-base font-bold text-gray-900">{data.student_name}</p>
          </div>

          <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <Phone size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">WhatsApp</span>
            </div>
            <p className="text-base font-mono font-bold text-gray-900">{data.phone}</p>
          </div>

          <div className="border border-slate-100 rounded-xl p-3.5 bg-white">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <GraduationCap size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Jenjang Pendidikan</span>
            </div>
            <p className="text-base font-bold text-gray-900">{data.education_level}</p>
          </div>

          <div className="border border-slate-100 rounded-xl p-3.5 bg-white md:col-span-2">
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <Package size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Paket Pilihan</span>
            </div>
            <p className="text-base font-bold text-blue-600">{data.package?.package_name || data.package_name || "-"}</p>
          </div>         

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catatan Khusus Pengaju</label>
            <div className="mt-1.5 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-700 min-h-[80px]">
              {data.notes || "Tidak ada catatan khusus dari wali murid."}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ubah Tahapan Status Administrasi</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl p-3 mt-1.5 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 border-t pt-4">
          <a
            href={`https://wa.me/${data.phone.replace(/^0/, "62").replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
          >
            <MessageCircle size={16} />
            Hubungi via WA
          </a>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              type="button"
              onClick={handleConvert} 
              disabled={loading || status !== "CONTACTED" || data.status === "REGISTERED"} 
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-xs
                ${status === "CONTACTED" && data.status !== "REGISTERED" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              Convert Lead
            </button>            
            
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={loading || data.status === "REGISTERED"} 
              className={`flex-1 sm:flex-none px-4 py-2.5 font-bold text-sm text-white rounded-xl transition-all shadow-xs
                ${data.status === "REGISTERED" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {loading ? "Menyimpan..." : data.status === "REGISTERED" ? "Sudah Terdaftar" : "Update Status"}
            </button>         
          </div>
        </div>

      </div>
    </div>
  );
}