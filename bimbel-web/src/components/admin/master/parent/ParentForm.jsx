import { useState, useEffect } from "react";
import LocationPicker from "../../../ui/LocationPicker";

export default function ParentForm({initialData,onSubmit,loading, onClose}) {
  const [form, setForm] = useState({
    full_name: "",
    occupation: "",
    relationship: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        full_name: initialData.full_name || "",
        occupation: initialData.occupation || "",
        relationship: initialData.relationship || "",
        address: initialData.address || "",
        latitude: initialData.latitude ?? "",
        longitude: initialData.longitude ?? "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      latitude: form.latitude === "" ? null : form.latitude,
      longitude: form.longitude === "" ? null : form.longitude,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm">Nama Orang Tua</label>
        <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border rounded-xl px-3 py-2"/>
      </div>

      <div>
        <label className="block mb-1 text-sm">Pekerjaan</label>
        <input type="text" name="occupation" value={form.occupation} onChange={handleChange} className="w-full border rounded-xl px-3 py-2"/>
      </div>

      <div>
        <label className="block mb-1 text-sm">Hubungan</label>
        <select name="relationship" value={form.relationship} onChange={handleChange} className="w-full border rounded-xl px-3 py-2">
          <option value="">Pilih Hubungan</option>
          <option value="orang_tua">Orang Tua</option>
          <option value="wali">Wali</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm">Alamat Rumah</label>
        <textarea rows={2} name="address" value={form.address} onChange={handleChange} className="w-full border rounded-xl px-3 py-2"/>
        <p className="text-[11px] text-gray-400 mt-1">Alamat & titik rumah otomatis sama dengan data anak (dipakai untuk absen GPS tentor les private).</p>
      </div>

      <LocationPicker
        label="Titik Rumah"
        radius={100}
        height={200}
        value={{ latitude: form.latitude, longitude: form.longitude }}
        onChange={({ latitude, longitude }) => setForm({ ...form, latitude, longitude })}
      />

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Batal</button>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-blue-700">
              {loading ? "Menyimpan Data..." : "Simpan / Update"}
            </button>
          </div>    </form>
  );
}