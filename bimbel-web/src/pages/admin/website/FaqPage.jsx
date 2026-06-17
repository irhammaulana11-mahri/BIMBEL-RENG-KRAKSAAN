import { useEffect, useState } from "react";
import { Plus,Pencil,Trash2, } from "lucide-react";
import { getFaqs,deleteFaq, } from "../../../services/faqService";
import FaqModal from "../../../components/admin/faq/FaqModal";

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
      setFaqs(response.data?.data || response.data || []);
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
    const confirmDelete =
      window.confirm(
        "Yakin ingin menghapus FAQ ini?"
      );

    if (!confirmDelete) return;

    try {
      await deleteFaq(id);

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        "Gagal menghapus FAQ"
      );
    }
  };

  const activeCount = Array.isArray(faqs) ? faqs.filter((item) => item.is_active ).length : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div> 
            <h1 className="text-3xl font-bold">FAQ Management</h1>
            <p className="text-gray-500"> Kelola pertanyaan yang sering ditanyakan</p>
          </div>

          <button onClick={handleCreate} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700
              text-white rounded-xl "
          >
            <Plus size={18} />Tambah FAQ
          </button>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Total FAQ</p>
            <h2 className="text-3xl font-bold">{faqs.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">FAQ Aktif</p>
            <h2 className="text-3xl font-bold text-green-600">{activeCount}</h2>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">FAQ Nonaktif</p>
            <h2 className="text-3xl font-bold text-red-600">{faqs.length - activeCount}</h2>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Pertanyaan</th>
                <th className="p-4 text-left">Jawaban</th>
                <th className="p-4 text-center">Urutan</th>
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

              {!loading && faqs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">Belum ada data FAQ
                    </td>
                  </tr>
                )}

              {!loading && faqs.map((item) => (
                    <tr key={item.id} className="border-t">

                      {/* Question */}
                      <td className="p-4">
                        <div className="font-semibold">{item.question}</div>
                      </td>

                      {/* Answer */}
                      <td className="p-4">
                        <div className="text-sm text-gray-600 line-clamp-2 max-w-xl">
                          {item.answer}
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="text-center">
                        {item.sort_order}
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

                      {/* Actions */}
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

      <FaqModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </>
    </div>
  );
}