import React, { useEffect, useState } from "react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { getApiErrorMessage } from "@/utils/apiError";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getFaqs, deleteFaq } from "@/services/admin/website/faqService";
import FaqTable from "../../../components/admin/website/faq/FaqTable";
import FaqModal from "../../../components/admin/website/faq/FaqModal";
import PremiumStatCard from "../../../components/ui/StatCard";


export default function FaqPage() {
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getFaqs();
      setFaqs(response.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelected(null);
    setOpenModal(true);
  };

  const handleEdit = (item) => {
    setSelected(item);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({ title: "Hapus FAQ?", message: "Tanya jawab ini akan dihapus dari website." });
    if (!ok) return;
    try {
      await deleteFaq(id);
      showSuccess("FAQ dihapus.");
      loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, "Gagal menghapus data."));
    }
  };

  const activeCount = faqs.filter((item) => item.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman (text-3xl) + Tombol Sejajar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen FAQ</h1>
          <p className="text-base text-gray-500 mt-1">
            Kelola daftar pertanyaan umum (Frequently Asked Questions) untuk mempermudah calon wali murid mendapatkan informasi.
          </p>
        </div>
        <button 
          onClick={handleCreate} 
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah FAQ Baru
        </button>
      </div>

      {/* Baris Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total FAQ" value={faqs.length} desc="Pertanyaan terdaftar" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="FAQ Aktif" value={activeCount} desc="Tayang di landing page" icon={CheckCircle} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Nonaktif" value={faqs.length - activeCount} desc="Draft / Arsip internal" icon={XCircle} colorClass="bg-red-50 text-red-700" />
      </div>

      {/* Kontainer Utama Tabel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Render Komponen Tabel Pecahan */}
        <FaqTable 
          data={faqs}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>

      <FaqModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
  </div>
  );
}