import React, { useEffect, useState } from "react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { getApiErrorMessage } from "@/utils/apiError";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getActivities, deleteActivities } from "@/services/admin/website/activityService";
import ActivityTable from "../../../components/admin/website/activity/ActivityTable";
import ActivityModal from "../../../components/admin/website/activity/ActivityModal";
import PremiumStatCard from "../../../components/ui/StatCard";


export default function BannersPage() {
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getActivities();
      setActivities(res.data.data || []);
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

  const handleEdit = (activity) => {
    setSelected(activity);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({ title: "Hapus Kegiatan?", message: "Dokumentasi kegiatan ini akan dihapus dari website." });
    if (!ok) return;
    try {
      await deleteActivities(id);
      showSuccess("Kegiatan dihapus.");
      loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, "Gagal menghapus data."));
    }
  };

  const activeCount = activities.filter((x) => x.is_active).length;

  return (
    // PERBAIKAN: Menggunakan pembungkus standar terpadu yang membuang padding ganda kaku
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman (text-3xl) + Tombol Sejajar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Kegiatan</h1>
          <p className="text-base text-gray-500 mt-1">
            Kelola dokumentasi agenda bimbel, rilis berita kegiatan, serta galeri foto interaktif publik.
          </p>
        </div>
        <button  
          onClick={handleCreate} 
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kegiatan
        </button>
      </div>

      {/* Row Kumpulan Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Kegiatan" value={activities.length} desc="Dokumentasi terdaftar" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Kegiatan Aktif" value={activeCount} desc="Tayang di galeri website" icon={CheckCircle} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Kegiatan Diarsipkan" value={activities.length - activeCount} desc="Disembunyikan dari publik" icon={XCircle} colorClass="bg-red-50 text-red-700" />
      </div>

      {/* Wadah Utama Tunggal Pembungkus Konten Tabel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Render Komponen Tabel Baru */}
        <ActivityTable 
          data={activities} 
          loading={loading} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />

      </div>

      <ActivityModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
  </div>
  );
}