export default function PackagePreview({ form }) {
  return (
    <div className="rounded-2xl p-6 text-white shadow-lg" style={{backgroundColor: form.card_color || "#2563eb",}}>
      <h3 className="text-2xl font-bold">{form.package_name || "Nama Paket"}</h3>
      <p className="opacity-90">{form.education_level || "Jenjang"}</p>
      <div className="mt-4 text-3xl font-bold">Rp{" "}{Number(form.price || 0).toLocaleString("id-ID")}</div>
      <div className="mt-4 space-y-2">
        <p>📚 {form.meeting_per_month || 0}x Pertemuan</p>
        <p>⏰ {form.duration_minutes || 0}Menit</p>
          {form.is_home_visit && (<p>🏠 Home Visit</p>)}
          {form.is_building_class && (<p>🏫 Building Class</p>)}
      </div>
      <button type="button" className="mt-6 bg-white text-black px-4 py-2 rounded-xl font-semibold">Daftar Sekarang</button>
    </div>
  );
}