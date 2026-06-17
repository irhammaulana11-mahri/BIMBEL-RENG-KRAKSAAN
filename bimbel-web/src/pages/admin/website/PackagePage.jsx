import { useEffect, useState } from "react";
import { Plus,Pencil,Trash2,Home,Building2, } from "lucide-react";
import { getPackages,deletePackage, } from "../../../services/packageService";
import PackageModal from "../../../components/admin/package/PackageModal";

export default function PackagePage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getPackages();
      setPackages(res.data.data || []);
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
    const confirmDelete = confirm("Hapus paket ini?");

    if (!confirmDelete) return;
    await deletePackage(id);
    loadData();
  };

  const activeCount = packages.filter((x) => x.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
        <>
        <div className="space-y-6">
  
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Package Management</h1>
            <p className="text-gray-500">Kelola paket bimbingan belajar</p>
          </div>

          <button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl">
            <Plus size={18} />Tambah Paket
          </button>
        </div>

        {/* Statistic */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Total Paket</p>
            <h2 className="text-3xl font-bold">{packages.length}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Paket Aktif</p>
            <h2 className="text-3xl font-bold text-green-600">{activeCount}</h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Paket Nonaktif</p>
            <h2 className="text-3xl font-bold text-red-600">{packages.length - activeCount}</h2>
          </div>
        </div>

        {/* Package Card */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading && ( 
            <div>Loading...</div>
          )}

          {!loading && packages.map((item) => (
          <div key={item.id} className="rounded-3xl shadow-lg overflow-hidden text-white" style={{backgroundColor:
              item.card_color || "#2563eb",
              }}
          >
          <div className="p-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-2xl font-bold">{item.package_name}</h3>
                <p className="opacity-80">{item.education_level}</p>
              </div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{item.is_active ? "Aktif" : "Nonaktif"}</span>
            </div>
            <div className="mt-6 text-4xl font-bold">Rp{" "}{Number(item.price).toLocaleString("id-ID")}</div>
          
          <div className="mt-6 space-y-3">
            <div>📚{" "}{item.meeting_per_month}x Pertemuan</div>
            <div>⏰{" "}{item.duration_minutes}{" "}Menit</div>
              {item.is_home_visit && (
                <div className="flex gap-2">
                  <Home size={18}/>Home Visit
                </div>
              )}

              {item.is_building_class && (
                <div className="flex gap-2">
                  <Building2 size={18}/>Building Class
                </div>
              )}
            </div>

            <div className="mt-4 text-sm opacity-90 line-clamp-3">{item.description}</div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => handleEdit(item)} className="flex-1 bg-white/20 rounded-xl py-2">
                <Pencil size={18} className="mx-auto"/>
              </button>
              <button onClick={() => handleDelete(item.id)} className="flex-1 bg-red-500/70 rounded-xl py-2">
                <Trash2 size={18} className="mx-auto"/>
              </button>
            </div>
          </div>
          </div>
          )
          )}
        </div>

        <PackageModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
        </div>
    </>
  </div>
  );
}