import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getArticles,deleteArticle, } from "../../../services/articleService";
import ArticleModal from "../../../components/admin/article/ArticleModal";

export default function ArticlePage() {
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
    if (!confirm("Hapus artikel?")) return;
    await deleteArticle(id);
    loadData();
  };

  const publishedCount = articles.filter((item) => item.is_published).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">

    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Article Management</h1>
            <p className="text-slate-500">Kelola artikel website</p>
          </div>

          <button onClick={handleCreate} className="px-5 py-3 rounded-xl bg-blue-600 text-white flex items-center gap-2">
            <Plus size={18} />Tambah Artikel
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow">
            <p>Total Artikel</p>
            <h2 className="text-3xl font-bold">
              {articles.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p>Published</p>
            <h2 className="text-3xl font-bold text-green-600">
              {publishedCount}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p>Draft</p>
            <h2 className="text-3xl font-bold text-red-600">
              {articles.length - publishedCount}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Artikel</th>
                <th className="p-4 text-left">Kategori</th>
                <th className="p-4 text-left">Penulis</th>
                <th className="p-4 text-center">Views</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {articles.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4">
                    <div className="flex gap-4">
                      <img src={`http://127.0.0.1:8001${item.featured_image}`} className="w-28 h-20 rounded-xl object-cover"/>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-slate-500">{item.summary}</p>
                      </div>
                    </div>
                  </td>

                  <td>{item.categories?.map((cat) => cat.category_name).join(", ")}</td>
                  <td>{item.author?.name}</td>
                  <td className="text-center">{item.view_count}</td>
                  <td className="text-center">
                    <span
                      className={
                        item.is_published
                          ? "bg-green-100 text-green-700 px-3 py-1 rounded-full"
                          : "bg-red-100 text-red-700 px-3 py-1 rounded-full"
                      }
                    >
                      {item.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 bg-amber-100 rounded-lg">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ArticleModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </>
    </div>
  );
}