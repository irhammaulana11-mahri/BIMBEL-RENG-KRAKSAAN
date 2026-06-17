import PackagePreview from "./PackagePreview";

export default function PackageForm({form,setForm,}) {
  const handleChange = (e) => {
    const {name,value,type,checked,} = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label>Nama Paket</label>
          <input name="package_name" value={form.package_name} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>
        <div>
          <label>Jenjang</label>
          <select name="education_level" value={form.education_level} onChange={handleChange} className="w-full border rounded-xl p-3">
            <option value="">Pilih Jenjang</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="SNBT">SNBT</option>
            <option value="Kedinasan">Kedinasan</option>
          </select>
        </div>

        <div>
          <label>Deskripsi</label>
          <textarea rows="4" name="description" value={form.description} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>

        <div>
          <label>Harga</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border rounded-xl p-3"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Pertemuan/Bulan</label>
            <input type="number" name="meeting_per_month" value={form.meeting_per_month} onChange={handleChange} className="w-full border rounded-xl p-3"/>
          </div>
          <div>
            <label>Durasi (Menit)</label>
            <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} className="w-full border rounded-xl p-3"/>
          </div>
        </div>

        {/* <div>
          <label>Warna Kartu</label>
          <input type="color" name="card_color" value={form.card_color} onChange={handleChange} className="w-full h-12"/>
        </div> */}

        <div className="space-y-2">
          <label className="flex gap-2">
            <input type="checkbox" name="is_home_visit" checked={form.is_home_visit}onChange={handleChange}/>Home Visit
          </label>
          <label className="flex gap-2">
            <input type="checkbox" name="is_building_class" checked={form.is_building_class}onChange={handleChange}/>Building Class
          </label>

          <label className="flex gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}/>Aktif
          </label>
        </div>
      </div>

      <PackagePreview form={form}/>
    </div>
  );
}