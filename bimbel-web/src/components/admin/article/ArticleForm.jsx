import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CategorySelector from "./CategorySelector";
import ArticlePreview from "./ArticlePreview";

export default function ArticleForm({form,setForm,preview,handleImage,}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">

      {/* FORM */}
      <div className="space-y-5">
        <div>
          <label>Judul Artikel</label>
          <input type="text" value={form.title} onChange={(e) => setForm({...form,title:e.target.value,})}
            className="w-full border rounded-xl p-3"/>
        </div>
        <div>
          <label>Ringkasan</label>
          <textarea rows={3} value={form.summary} onChange={(e) => setForm({...form,summary:e.target.value,})}
            className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label>Konten Artikel</label>
          <textarea rows={10} value={form.content} onChange={(e) => setForm({...form,content:e.target.value,})}
            className="w-full border rounded-xl p-3"/>
        </div>

        <CategorySelector value={form.categories} onChange={(categories) => setForm({...form,categories,})}/>

        <div>
          <label>Publish Date</label>
          <DatePicker selected={form.publish_date ? new Date(form.publish_date) : null} onChange={(date) =>
              setForm({...form,publish_date:date,})} dateFormat="dd/MM/yyyy" className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label className="flex gap-3 items-center">
            <input type="checkbox" checked={form.is_published} onChange={(e) =>
                setForm({...form,is_published : e.target.checked,})}
            />Publish Artikel</label>
        </div>

        <div>
          <label>Featured Image</label>
          <div className="flex border rounded-xl overflow-hidden">
            <label className="px-5 py-3 bg-slate-100 cursor-pointer">Choose File
              <input hidden type="file" accept="image/*" onChange={handleImage}/>
            </label>

            <div className="flex-1 px-4 py-3 text-slate-500">
              {preview ? "Gambar dipilih" : "No file chosen"}
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW */}

      <ArticlePreview form={{...form,featured_image : preview || form.featured_image,}}/>
    </div>
  );
}