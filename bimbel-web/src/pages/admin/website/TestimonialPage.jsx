import React, { useEffect, useState } from "react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { getApiErrorMessage } from "@/utils/apiError";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getTestimonials, deleteTestimonial } from "@/services/admin/website/testimonialService";
import TestimonialTable from "../../../components/admin/website/testimonial/TestimonialTable";
import TestimonialModal from "../../../components/admin/website/testimonial/TestimonialModal";
import PremiumStatCard from "../../../components/ui/StatCard";


export default function TestimonialPage() {
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getTestimonials();
      setTestimonials(response.data.data || []);
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
    const ok = await confirm.delete({ title: "Hapus Testimoni?", message: "Testimoni ini akan dihapus dari halaman utama website." });
    if (!ok) return;
    try {
      await deleteTestimonial(id);
      showSuccess("Testimoni dihapus.");
      loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, "Gagal menghapus data."));
    }
  };

  const activeCount = testimonials.filter((item) => item.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Testimoni</h1>
          <p className="text-base text-gray-500 mt-1">
            Kelola ulasan tingkat kepuasan, kisah sukses alumni, dan apresiasi wali murid untuk kredibilitas brand publik.
          </p>
        </div>
        <button 
          onClick={handleCreate} 
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Testimoni
        </button>
      </div>

      {/* Baris Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Ulasan" value={testimonials.length} desc="Kumulatif kepuasan siswa" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Testimoni Tayang" value={activeCount} desc="Aktif di landing page" icon={CheckCircle} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Ditangguhkan" value={testimonials.length - activeCount} desc="Disimpan sebagai arsip" icon={XCircle} colorClass="bg-red-50 text-red-700" />
      </div>

      {/* Wadah Utama Tunggal Pembungkus Konten Tabel Terpisah */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Render Komponen Tabel Terpisah */}
        <TestimonialTable 
          data={testimonials}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>

      <TestimonialModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
  </div>
  );
}