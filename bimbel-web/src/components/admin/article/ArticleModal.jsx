import { useEffect,useState,} from "react";
import { createArticle,updateArticle,} from "../../../services/articleService";
import { uploadImage, } from "../../../services/uploadService";
import ArticleForm from "./ArticleForm";

export default function ArticleModal({open,onClose,data,onSuccess,}) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] =
    useState({
      title: "",
      summary: "",
      content: "",
      categories: [],
      featured_image: "",
      publish_date: "",
      is_published: true,
    });

  useEffect(() => {
    if (!data) return;

    setForm({
      title: data.title || "",
      summary: data.summary || "",
      content: data.content || "",
      publish_date: data.publish_date || "",
      featured_image: data.featured_image || "",
      categories: data.categories?.map((item) => item.id ) || [],is_published:data.is_published ?? true,
    });

    if (data.featured_image) {
      setPreview(`http://127.0.0.1:8001${data.featured_image}`);
    }
  }, [data]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        let payload = {...form,};

        if (imageFile) {
          const upload = await uploadImage(imageFile);
          payload.featured_image = upload;
        }


        if (data?.id) {
          await updateArticle(data.id,payload);
        } else {
          await createArticle(payload);
        }

        onSuccess();
        onClose();
      } finally {
        setLoading(false);
      }
    };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-auto p-8">
        <div className="flex justify-between mb-6 ">
          <h2 className="text-3xl font-bold ">
            {data ? "Edit Artikel" : "Tambah Artikel"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <ArticleForm form={form} setForm={setForm} preview={preview} handleImage={handleImage}/>
          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-3 border rounded-xl">Batal</button>
            <button type="submit" disabled={loading} className="px-5 py-3 bg-blue-600 text-white rounded-xl">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}