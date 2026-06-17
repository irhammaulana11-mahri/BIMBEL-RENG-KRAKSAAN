import ActivityPreview from "./AcitvityPreview";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function ActivityForm({form,setForm,preview,handleImage,activityFile}) {
  const handleChange = (e) => {const {name,value,} = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label>Judul Kegiatan</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label>Tanggal Kegiatan</label>
          <div >
            <DatePicker selected={form.activity_date ? new Date(form.activity_date) : null} onChange={(date) =>
                  setForm({
                  ...form,
                  activity_date: date,
                  })
              }
              className="w-full border rounded-xl p-3"/>
          </div>
          {/* <input type="date" name="activity_date" value={form.activity_date} onChange={handleChange} className="w-full border rounded-xl p-3"/> */}
        </div>

        <div>
          <label>Lokasi</label>
          <input name="location" value={form.location} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label>Deskripsi</label>
          <textarea rows="6" name="description" value={form.description} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label>Cover Image</label>
            <label className="flex items-center border rounded-xl overflow-hidden cursor-pointer bg-white">
                <span className="px-5 py-3 bg-slate-50 border-r whitespace-nowrap">Choose File</span>
                <span className="px-4 text-gray-500 truncate">{activityFile ? activityFile.name : "No file chosen"}</span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden"/>
            </label>
        </div>
        
        {/* Status */}
        <div>
          <label className="flex gap-3">
            <input type="checkbox" checked={form.is_active} onChange={(e) =>
                setForm({
                  ...form,
                  is_active:
                    e.target.checked,
                })
              }
            />
            Activities Aktif
          </label>
        </div>
      </div>


      <ActivityPreview form={{...form,cover_image:preview || (form.cover_image
        ? `http://127.0.0.1:8001${form.cover_image}`
        : ""),}}/>
    </div>
  );
}