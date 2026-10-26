import BannerPreview from "./BannerPreview";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BannerForm({form,setForm,preview,handleImage,bannerFile,}) {
  return (
    <div className="space-y-6">
      {/* Judul */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">Judul Banner</label>
          <input type="text"value={form.title} onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            } 
            className="w-full border rounded-xl p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Urutan</label>
          <input type="number" value={form.sort_order} onChange={(e) =>
              setForm({
                ...form,
                sort_order:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />
        </div>
      </div>

      {/* Subtitle */}
      <div>
        <label className="block mb-2 font-medium">Subtitle</label>
        <textarea rows="3" value={form.subtitle} onChange={(e) =>
            setForm({
              ...form,
              subtitle:
                e.target.value,
            })
          }
          className="w-full border rounded-xl p-3"
        />
      </div>

      {/* Button */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">Text Tombol</label>
          <input type="text" value={form.button_text} onChange={(e) =>
              setForm({
                ...form,
                button_text:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">Link Tombol</label>
          <input type="text" value={form.button_link} onChange={(e) =>
              setForm({
                ...form,
                button_link:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />
        </div>
      </div>

      {/* Periode */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">Tanggal Mulai</label>
          <DatePicker selected={form.start_date ? new Date(form.start_date) : null} onChange={(date) =>
                setForm({
                ...form,
                start_date: date,
                })
            }
            className="w-full border rounded-xl px-4 py-3"/>
        </div>

        <div>
          <label className="block mb-2 font-medium">Tanggal Berakhir</label>
          <DatePicker selected={form.end_date ? new Date(form.end_date) : null} onChange={(date) =>
                setForm({
                ...form,
                end_date: date,
                })
            }
            className="w-full border rounded-xl px-4 py-3"
            />
        </div>

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
          Banner Aktif
        </label>
      </div>

      {/* Upload */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
            <label className="block font-medium mb-2">Upload Banner</label>
            <label className="flex items-center border rounded-xl overflow-hidden cursor-pointer bg-white">
                <span className="px-5 py-3 bg-slate-50 border-r whitespace-nowrap">Choose File</span>
                <span className="px-4 text-gray-500 truncate">{bannerFile ? bannerFile.name : "No file chosen"}</span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden"/>
            </label>
            <p className="text-sm text-gray-500 mt-2">JPG, PNG, WEBP</p>
            </div>
            <div className="border rounded-2xl overflow-hidden h-72 bg-slate-50 flex items-center justify-center">
                {preview ? ( 
                    <img src={preview} alt="Banner Preview" className="w-full h-full object-cover"/>
                ) : (
                    <div className="text-gray-400">Banner Preview</div>
                )}
            </div>
      </div>
    </div>
  );
}