import React, { useEffect, useState } from "react";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getFaqs, deleteFaq } from "../../../services/faqService";
import FaqTable from "../../../components/admin/website/faq/FaqTable";
import FaqModal from "../../../components/admin/website/faq/FaqModal";

const PremiumStatCard = ({ title, value, desc, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{desc}</p>
    </div>
    <div className={`p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function FaqPage() {
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
    const confirmDelete = window.confirm("Hapus daftar tanya jawab (FAQ) ini dari website?");
    if (!confirmDelete) return;
    try {
      await deleteFaq(id);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data");
    }
  };

  const activeCount = faqs.filter((item) => item.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
      
      {/* Header Halaman (text-3xl) + Tombol Sejajar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">FAQ Management</h1>
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

        {/* Footer Pagination Terpadu */}
        <div className="border-t border-gray-100 p-5 bg-gray-50/20 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-600 font-medium">
              Menampilkan <span className="text-gray-900 font-bold">1</span> - <span className="text-gray-900 font-bold">{faqs.length}</span> dari <span className="text-gray-900 font-bold">{faqs.length}</span> data records FAQ
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Prev</button>
              <button className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">1</button>
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Next</button>
            </div>
          </div>
        </div>

      </div>

      <FaqModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
  </div>
  );
}