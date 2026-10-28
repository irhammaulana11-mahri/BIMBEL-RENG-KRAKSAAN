import React, { useEffect, useState } from "react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { getApiErrorMessage } from "@/utils/apiError";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getBanners, deleteBanner } from "@/services/admin/website/bannerService";
import BannerTable from "../../../components/admin/website/banner/BannerTable";
import BannerModal from "../../../components/admin/website/banner/BannerModal";
import PremiumStatCard from "../../../components/ui/StatCard";


export default function BannerPage() {
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getBanners();
      setBanners(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpenModal(true);
  };

  const handleEdit = (banner) => {
    setSelected(banner);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({ title: "Hapus Banner?", message: "Banner ini akan dihapus dari halaman publik." });
    if (!ok) return;
    try {
      await deleteBanner(id);
      showSuccess("Banner dihapus.");
      loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, "Gagal menghapus data."));
    }
  };

  const activeCount = banners.filter((x) => x.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Banner</h1>
          <p className="text-base text-gray-500 mt-1">
            Kelola banner promosi, info pendaftaran, dan pengumuman visual untuk halaman utama website.
          </p>
        </div>
        <button  
          onClick={handleCreate} 
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Banner
        </button>
      </div>

      {/* Baris Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Koleksi Banner" value={banners.length} desc="Tercatat di basis data" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Banner Tayang (Aktif)" value={activeCount} desc="Muncul di slide utama" icon={CheckCircle} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Banner Ditangguhkan" value={banners.length - activeCount} desc="Disimpan sebagai arsip" icon={XCircle} colorClass="bg-red-50 text-red-700" />
      </div>

      {/* Wadah Utama Tunggal Pembungkus Konten Tabel Pecahan */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Render Komponen Tabel Terpisah */}
        <BannerTable 
          data={banners}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Footer Pagination Terpadu */}
        <div className="border-t border-gray-100 p-5 bg-gray-50/20 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-600 font-medium">
              Menampilkan <span className="text-gray-900 font-bold">1</span> - <span className="text-gray-900 font-bold">{banners.length}</span> dari <span className="text-gray-900 font-bold">{banners.length}</span> entri promosi visual web
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Prev</button>
              <button className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">1</button>
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Next</button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Form */}
      <BannerModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
      </div>

  );
}