import { useEffect,useState,} from "react";
import { createActivities,updateActivities, } from "../../../services/activityService";
import { uploadImage,} from "../../../services/uploadService";
import ActivityForm from "./ActivityForm";

export default function ActivityModal({open,onClose,data,onSuccess,}) {
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
      title: "",
      description: "",
      activity_date: "",
      location: "",
      cover_image: "",
      is_active:true,
    });

  useEffect(() => {
    if (!data) return;

    setForm({
      title: data.title || "",
      description: data.description || "",
      activity_date: data.activity_date || "",
      location: data.location || "",
      cover_image: data.cover_image || "",
      is_active: data.is_active || "",
    });

    if (data.cover_image) {
      setPreview(`http://127.0.0.1:8001${data.cover_image}`);
    }
  }, [data]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        let payload = {...form,is_active: form.is_active,};
        if (coverFile) {
          const imageUrl = await uploadImage(coverFile);
          payload.cover_image = imageUrl;
        }

        if (data?.id) {
          await updateActivities(data.id,payload);
        } else {
          await createActivities(payload);
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
      <div className="bg-white rounded-2xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {data? "Edit Kegiatan" : "Tambah Kegiatan"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <ActivityForm form={form} setForm={setForm} preview={preview} handleImage={handleImage}/>
          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}