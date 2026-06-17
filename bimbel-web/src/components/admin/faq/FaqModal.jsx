import { useEffect,useState, } from "react";
import { createFaq,updateFaq, } from "../../../services/faqService";
import FaqForm from "./FaqForm";
import FaqPreview from "./FaqPreview";

export default function FaqModal({open,onClose,data,onSuccess,}) {
  const [loading,setLoading] = useState(false);
  const [form,setForm] = useState({
      question:"",
      answer:"",
      sort_order:1,
      is_active:true,
    });

  useEffect(() => {
    if(!data) return;

    setForm({
      question:data.question || "",
      answer:data.answer || "",
      sort_order:data.sort_order || 1,
      is_active:data.is_active ?? true,
    });

  },[data]);

  const handleSubmit = async (e) => {
      e.preventDefault();

      try{
        setLoading(true);
        if(data){
          await updateFaq(data.id,form);
        }else{
          await createFaq(form);
        }
        onSuccess();
        onClose();
      }catch(error){
        console.error(error);
      }finally{
        setLoading(false);
      }
    };

  if(!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 flex justify-center items-center">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {data ? "Edit FAQ" : "Tambah FAQ"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            <FaqForm form={form} setForm={setForm}/>
            <FaqPreview form={form}/>
          </div>

          <div className="mt-6 border-t pt-4 flex justify-end gap-3">
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