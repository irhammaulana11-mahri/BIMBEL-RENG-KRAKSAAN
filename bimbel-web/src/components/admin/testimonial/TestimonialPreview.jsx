import { Star } from "lucide-react";

export default function TestimonialPreview({form,preview,}) {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex gap-1 mb-4">
          {Array.from({length: Number(form.rating || 0),}).map((_, i) => (
            <Star key={i} size={18} className="fill-yellow-400 text-yellow-400"/>
          ))}
        </div>

        <p className="italic text-gray-600">
          "
          {form.testimonial || "Isi testimoni siswa..."}
          "
        </p>

        <div className="flex items-center gap-3 mt-6">
          <img
            src={preview || "https://ui-avatars.com/api/?name=Student"}
            alt="" className="w-16 h-16 rounded-full object-cover"
          />

          <div>
            <h3 className="font-semibold">{form.student_name || "Nama Siswa"}</h3>
            <p className="text-sm text-gray-500">{form.school_name || "Asal Sekolah"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}