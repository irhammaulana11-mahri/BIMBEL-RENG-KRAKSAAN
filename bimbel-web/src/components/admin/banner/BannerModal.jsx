import { useEffect, useState } from "react";
import { createBanner,updateBanner, } from "../../../services/bannerService";
import { uploadImage } from "../../../services/uploadService";
import BannerForm from "./BannerForm";

export default function BannerModal({open,onClose,data,onSuccess,}) {
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] =
    useState({
      title: "",
      subtitle: "",
      image_url: "",
      button_text: "",
      button_link: "",
      sort_order: 1,
      is_active: true,
      start_date: "",
      end_date: "",
    });

  useEffect(() => {
    if (!data) return;

    setForm({
      title: data.title || "",
      subtitle: data.subtitle || "",
      image_url: data.image_url || "",
      button_text: data.button_text || "",
      button_link: data.button_link || "",
      sort_order: data.sort_order || 1,
      is_active: data.is_active,
      start_date: data.start_date || "",
      end_date: data.end_date || "",
    });

    if (data.image_url) {
      setPreview(`http://127.0.0.1:8001${data.image_url}`);
    }
  }, [data]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit =
    async (e) => {e.preventDefault();

      try {
        setLoading(true);
        let payload = {...form,};
        if (bannerFile) {
          const imageUrl = await uploadImage(bannerFile);
          payload.image_url = imageUrl;
        }

        if (data?.id) {
          await updateBanner(data.id,payload);
        } else {
          await createBanner(payload);
        }
        onSuccess();
        onClose();

      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between mb-6 ">
          <h2 className="text-xl font-bold">
            {data ? "Edit Banner" : "Tambah Banner"}
          </h2>

          <button onClick={onClose}>✕</button>
        </div>

        <form>
          <BannerForm form={form} setForm={setForm} preview={preview} handleImage={handleImage}/>
          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className=" px-4 py-2 border rounded-xl">Batal</button>
            <button type="submit" onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}