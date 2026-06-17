import { Calendar,User, } from "lucide-react";

export default function ArticlePreview({form,}) {
  return (
    <div className="border rounded-2xl overflow-hidden bg-white">
      <div className="h-60 bg-slate-100">
        {form.featured_image ? (
          <img src={form.featured_image} alt="Preview" className="w-full h-full object-cover"/>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">Belum ada gambar</div>
        )}
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">
          {form.title || "Judul Artikel"}
        </h2>

        <div className="flex gap-4 text-sm text-slate-500 mb-4">
          <span className="flex gap-1 items-center">
            <Calendar size={14} />
                {form.publish_date ? (form.publish_date instanceof Date ? form.publish_date
                : new Date(form.publish_date)).toLocaleDateString("id-ID") : "-"}
          </span>

          <span className="flex gap-1 items-center">
            <User size={14} />Admin</span>
        </div>

        <p className="text-slate-600">
          {form.summary || "Ringkasan artikel..."}
        </p>

      </div>
    </div>
  );
}