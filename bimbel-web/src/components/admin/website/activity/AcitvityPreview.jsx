export default function ActivityPreview({ form }) {
  return (
    <div className="border rounded-2xl overflow-hidden bg-white">
      {form.cover_image ? (
        <img
          src={form.cover_image}
          alt={form.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            console.log("Image Error:", e.target.src);
          }}
        />
      ) : (
        <div className="h-64 flex items-center justify-center bg-slate-100 text-slate-400">
          Belum ada cover
        </div>
      )}

      <div className="p-6">
        <h3 className="font-bold text-2xl">
          {form.title || "Judul Kegiatan"}
        </h3>

        <p className="text-slate-500">
          {form.activity_date
    ? (
        form.activity_date instanceof Date
          ? form.activity_date
          : new Date(form.activity_date)
      ).toLocaleDateString("id-ID")
    : "-"}
        </p>

        <p className="text-blue-600">
          {form.location}
        </p>

        <p className="mt-4 text-slate-600">
          {form.description}
        </p>
      </div>
    </div>
  );
}