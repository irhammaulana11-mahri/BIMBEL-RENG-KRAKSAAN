import { useEffect, useState } from "react";
import { Plus,Pencil,Trash2, } from "lucide-react";
import { getBanners,deleteBanner,createBanner,updateBanner} from "../../../services/bannerService";
import BannerModal from "../../../components/admin/banner/BannerModal";

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getBanners();
      setBanners(res.data.data);
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
    const confirmDelete = window.confirm("Hapus banner ini?");

    if (!confirmDelete) return;

    try {
      await deleteBanner(id);
      await loadData();
      alert("Banner berhasil dihapus");
    } catch (err) {
      console.log(err);
    }
  };

  const activeCount = banners.filter((x) => x.is_active).length;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID");
    };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
        <>
        <div className="space-y-6">
        
        {/* Header */}
            <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Banner Management</h1>
              <p className="text-gray-500">Kelola Banner Halaman Website</p>
            </div>
            <button  onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
                <Plus size={18} />Tambah Banner</button>
            </div>

            {/* Statistic */}
            <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-gray-500">Total Banner</p>

                <h2 className="text-3xl font-bold">
                {banners.length}
                </h2>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-gray-500">Banner Aktif</p>
                <h2 className="text-3xl font-bold text-green-600">
                {activeCount}
                </h2>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow">
                <p className="text-gray-500">Banner Nonaktif</p>

                <h2 className="text-3xl font-bold text-red-600">
                {banners.length - activeCount}
                </h2>
            </div>
            </div>

            {/* Table */}

            <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-slate-50">
                <tr>
                    <th className="p-4 text-left">Banner</th>
                    <th className="p-4 text-left">Informasi</th>
                    <th className="p-4 text-left">Urutan</th>
                    <th className="p-4 text-left">Awal Tayang</th>
                    <th className="p-4 text-left">Akhir Tayang</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                </tr>
                </thead>
                <tbody>
                {loading && (
                    <tr>
                    <td colSpan={5} className="text-center p-6">Loading...</td>
                    </tr>
                )}

                {!loading && banners.map((item) => (
                        <tr key={item.id} className="border-t">
                        <td className="p-4">
                            <img src={`http://127.0.0.1:8001${item.image_url}`}className="w-40 h-24 rounded-xl object-cover"/>
                        </td>
                        <td className="p-4">
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </td>
                        <td className="text-center">{item.sort_order}</td>
                        <td className="text-right">{formatDate(item.start_date)}</td>
                        <td className="text-right">{formatDate(item.end_date)}</td>
                        <td className="text-center">
                            <span className={`px-3 py-1 rounded-full text-sm ${item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                        </td>
                        <td>
                            <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                <Pencil size={18}/>
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-100 text-red-600">
                                <Trash2 size={18}/>
                            </button>
                            </div>
                        </td>
                        </tr>
                    )
                    )}
                </tbody>
            </table>
            </div>
        </div>

        <BannerModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
        </>
    </div>
  );
}