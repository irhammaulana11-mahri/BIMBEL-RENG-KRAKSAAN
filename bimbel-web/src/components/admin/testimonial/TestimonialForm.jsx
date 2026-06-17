import { Star } from "lucide-react";

export default function TestimonialForm({form,setForm,handleImage,testimonialFile}) {
  return (
    <div className="space-y-5">

      <div>
        <label>Nama Siswa</label>
        <input type="text" value={form.student_name} onChange={(e) => setForm({...form,student_name:e.target.value,})}
          className="w-full border rounded-xl p-3"
        />
      </div>

      <div>
        <label>Asal Sekolah</label>
        <input type="text" value={form.school_name} onChange={(e) => setForm({...form,school_name:e.target.value,})}
          className="w-full border rounded-xl p-3"/>
      </div>

      <div>
        <label>Rating</label>
        <div className="flex gap-2 mt-2">
          {[1,2,3,4,5].map(
            (star) => (
              <Star key={star} size={24} onClick={() => setForm({...form,rating: star,})}
                className={`cursor-pointer ${star <= form.rating? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                `}
              />
            )
          )}
        </div>
      </div>

      <div>
        <label>Testimoni</label>
        <textarea rows={6} value={form.testimonial} onChange={(e) => setForm({...form,testimonial:e.target.value,})}
          className="w-full border rounded-xl p-3"
        />
      </div>
      <div>
        <label>Foto Siswa</label>
            <label className="flex items-center border rounded-xl overflow-hidden cursor-pointer bg-white">
                <span className="px-5 py-3 bg-slate-50 border-r whitespace-nowrap">Choose File</span>
                <span className="px-4 text-gray-500 truncate">{testimonialFile ? testimonialFile.name : "No file chosen"}</span>
                <input type="file" accept="image/*" onChange={handleImage} className="hidden"/>
            </label>
            <p className="text-sm text-gray-500 mt-2">JPG, PNG, WEBP</p>
      </div>
      <div>
        <label className="flex gap-3">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form,is_active:e.target.checked,})}/>
          Testimoni Aktif
        </label>
      </div>
    </div>
  );
}