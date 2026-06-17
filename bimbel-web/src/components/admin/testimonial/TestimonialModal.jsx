import { useEffect,useState, } from "react";
import TestimonialForm from "./TestimonialForm";
import TestimonialPreview from "./TestimonialPreview";
import { uploadImage } from "../../../services/uploadService";
import { createTestimonial,updateTestimonial, } from "../../../services/testimonialService";

export default function TestimonialModal({open,onClose,data,onSuccess,}) {
  const [loading,setLoading] = useState(false);
  const [preview,setPreview] = useState("");
  const [testimonialFile, setTestimonialFile] = useState(null);
  const [form,setForm] =
    useState({
      student_name:"",
      school_name:"",
      testimonial:"",
      photo_url:"",
      rating:5,
      is_active:true,
    });

  useEffect(() => {
    if(!data) return;

    setForm({
      student_name:data.student_name || "",
      school_name:data.school_name || "",
      testimonial:data.testimonial || "",
      photo_url:data.photo_url || "",
      rating:data.rating || 5,
      is_active:data.is_active ?? true,
    });

    if(data.photo_url){
      setPreview(
        `http://127.0.0.1:8001${data.photo_url}`
      );
    }

  },[data]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTestimonialFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();

      try{
        setLoading(true);
        let payload = {...form,};
        if (testimonialFile) {
          const imageUrl = await uploadImage(testimonialFile);
          payload.photo_url = imageUrl;
        }

        if (data?.id) {
          await updateTestimonial(data.id,payload);
        } else {
          await createTestimonial(payload);
        }
        onSuccess();
        onClose();
      }catch(err){
        console.error(err);
      }finally{
        setLoading(false);
      }
    };

  if(!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[99999] flex justify-center items-center">
      <div onClick={(e)=> e.stopPropagation()} className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh]
          overflow-auto p-6"
      >
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {data ? "Edit Testimoni" : "Tambah Testimoni"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form>
            <TestimonialForm form={form} setForm={setForm} handleImage={handleImage}/>
            <TestimonialPreview form={form} preview={preview}/>

          <div className="sticky bottom-0 bg-white pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 border rounded-xl">Batal</button>
            <button type="submit" onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}