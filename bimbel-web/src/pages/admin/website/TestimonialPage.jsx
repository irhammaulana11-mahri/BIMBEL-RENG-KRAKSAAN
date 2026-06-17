import { useEffect, useState } from "react";
import { Plus,Pencil,Trash2,Star,} from "lucide-react";
import TestimonialModal from "../../../components/admin/testimonial/TestimonialModal";
import { getTestimonials,deleteTestimonial,} from "../../../services/testimonialService";

export default function TestimonialPage() {
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
    const confirmDelete = window.confirm("Yakin ingin menghapus testimoni ini?");

    if (!confirmDelete) return;
    try {
      await deleteTestimonial(id);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data");
    }
  };

  const activeCount = testimonials.filter((item) => item.is_active).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Testimonials Management</h1>
            <p className="text-gray-500">Kelola Testimoni Siswa</p>
          </div>
          <button onClick={handleCreate} className="flex items-center gap-2 px-5 py-3 bg-blue-600
              text-white rounded-xl hover:bg-blue-700"
          >
            <Plus size={18} />Tambah Testimoni
          </button>
        </div>

        {/* Statistics */}

        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Total Testimoni</p>
            <h2 className="text-3xl font-bold">{testimonials.length}</h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Testimoni Aktif</p>
            <h2 className="text-3xl font-bold text-green-600">{activeCount}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Testimoni Nonaktif</p>
            <h2 className="text-3xl font-bold text-red-600">{testimonials.length - activeCount}
            </h2>
          </div>
        </div>

        {/* Table */}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Foto</th>
                <th className="p-4 text-left">Informasi</th>
                <th className="p-4 text-center">Rating</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center p-8">Loading...</td>
                </tr>
              )}

              {!loading && testimonials.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">Belum ada data</td>
                  </tr>
                )}

              {!loading && testimonials.map((item) => (
                  <tr key={item.id} className="border-t">

                    {/* Foto */}
                    <td className="p-4">
                      <img src={item.photo_url ? `http://127.0.0.1:8001${item.photo_url}` : "https://ui-avatars.com/api/?name=Student"}
                        alt="" className="w-16 h-16 rounded-full object-cover"
                      />
                    </td>

                    {/* Informasi */}
                    <td className="p-4">
                      <h3 className="font-semibold">{item.student_name}</h3>
                      <p className="text-sm text-gray-500">{item.school_name}</p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.testimonial}</p>
                    </td>

                    {/* Rating */}
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {Array.from({length:Number(item.rating),}).map((_, index) => (
                            <Star key={index} size={16} className="fill-yellow-400 text-yellow-400"/>
                          )
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <span className={`px-3 py-1 rounded-full text-sm
                          ${item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                        `}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Action */}
                    <td>
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-amber-100 text-amber-600">
                          <Pencil size={18}/>
                        </button>

                        <button onClick={() => handleDelete(item.id)}className="p-2 rounded-lg bg-red-100 text-red-600">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <TestimonialModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </>
    </div>
  );
}