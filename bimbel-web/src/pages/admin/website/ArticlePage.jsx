import React, { useEffect, useState } from "react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useConfirm } from "@/components/ui/confirmation";
import { getApiErrorMessage } from "@/utils/apiError";
import { Plus, Layers, CheckCircle, XCircle } from "lucide-react";
import { getArticles, deleteArticle } from "@/services/admin/website/articleService";
import ArticleTable from "../../../components/admin/website/article/ArticleTable";
import ArticleModal from "../../../components/admin/website/article/ArticleModal";

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

export default function ArticlePage() {
  const confirm = useConfirm();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getArticles();
      setArticles(res.data.data || []);
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

  const handleEdit = (item) => {
    setSelected(item);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm.delete({ title: "Hapus Artikel?", message: "Artikel ini akan dihapus dari publikasi website." });
    if (!ok) return;
    try {
      await deleteArticle(id);
      showSuccess("Artikel dihapus.");
      loadData();
    } catch (error) {
      showError(getApiErrorMessage(error, "Gagal menghapus data."));
    }
  };

  const publishedCount = articles.filter((item) => item.is_published).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman (text-3xl) + Tombol Sejajar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Article Management</h1>
          <p className="text-base text-gray-500 mt-1">
            Kelola publikasi materi edukasi, info seputar UTBK/SNBT, dan rilis berita resmi bimbel.
          </p>
        </div>
        <button 
          onClick={handleCreate} 
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Artikel
        </button>
      </div>

      {/* Row Kumpulan Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumStatCard title="Total Artikel" value={articles.length} desc="Tercatat di server" icon={Layers} colorClass="bg-slate-50 text-slate-600" />
        <PremiumStatCard title="Published" value={publishedCount} desc="Tayang & dapat dibaca" icon={CheckCircle} colorClass="bg-green-50 text-green-700" />
        <PremiumStatCard title="Draft" value={articles.length - publishedCount} desc="Dalam tahap penulisan" icon={XCircle} colorClass="bg-red-50 text-red-700" />
      </div>

      {/* Wadah Utama Tunggal Pembungkus Konten Tabel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Render Komponen Tabel Baru */}
        <ArticleTable 
          data={articles} 
          loading={loading} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />

        {/* Footer Pagination Terpadu */}
        <div className="border-t border-gray-100 p-5 bg-gray-50/20 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-600 font-medium">
              Menampilkan <span className="text-gray-900 font-bold">1</span> - <span className="text-gray-900 font-bold">{articles.length}</span> dari <span className="text-gray-900 font-bold">{articles.length}</span> materi artikel terbit
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Prev</button>
              <button className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">1</button>
              <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Next</button>
            </div>
          </div>
        </div>

      </div>

      <ArticleModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </div>
  </div>
  );
}