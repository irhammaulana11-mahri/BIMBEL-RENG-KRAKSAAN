import { useEffect, useState } from "react";
import { getCompanyProfile, createCompanyProfile, updateCompanyProfile } from "../../../services/companyProfileService";
import { uploadImage } from "../../../services/uploadService";

export default function CompanyProfilePage() {

  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [recordId, setRecordId] = useState(null);

  const [form, setForm] = useState({
    company_name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website_url: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    latitude: "",
    longitude: "",
    logo_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getCompanyProfile();
      const data = res.data.data;

      if (data) {
        setRecordId(data.id);
        setForm({
          company_name: data.company_name || "",
          address: data.address || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          website_url: data.website_url || "",
          facebook_url: data.facebook_url || "",
          instagram_url: data.instagram_url || "",
          youtube_url: data.youtube_url || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          logo_url: data.logo_url || "",
        });
        setLogoPreview(`http://127.0.0.1:8001${data.logo_url}`|| "");
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(
      URL.createObjectURL(file)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = { ...form };
      if (logoFile) {
        const imageUrl = await uploadImage(logoFile);
        payload.logo_url = imageUrl;
      }
      if (recordId) {
        await updateCompanyProfile(recordId,payload);
        alert("Data berhasil diperbarui");
      } else {
        const res = await createCompanyProfile(payload);
        setRecordId(res.data.data.id);
        alert("Data berhasil disimpan");
      }
    } catch (err) {
      console.log(JSON.stringify(err.response?.data,null,2));
      alert("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (

    <div>
      <h1 className="text-3xl font-bold mb-6">Company Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label>Nama Perusahaan</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} className="w-full border p-3 rounded mt-2"/>
          </div>
          <div>
            <label>Telepon</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border p-3 rounded mt-2"/>
          </div>
          <div>
            <label>Whatsapp</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full border p-3 rounded mt-2"/>
          </div>
          <div>
            <label>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Website</label>
            <input
              name="website_url"
              value={form.website_url}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Facebook</label>
            <input
              name="facebook_url"
              value={form.facebook_url}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Instagram</label>
            <input
              name="instagram_url"
              value={form.instagram_url}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Youtube</label>
            <input
              name="youtube_url"
              value={form.youtube_url}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Latitude</label>
            <input
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
          <div>
            <label>Longitude</label>
            <input
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              className="w-full border p-3 rounded mt-2"
            />
          </div>
        </div>
        <div className="mt-5">
          <label>Alamat</label>
          <textarea
            rows="4"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-3 rounded mt-2"
          />
        </div>
        <div className="mt-6">
          <label className="block mb-3 font-medium">
            Logo Perusahaan
          </label>
          <div className="grid grid-cols-2 gap-6">
            {/* Upload */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="
                  w-full
                  border
                  rounded-lg
                  p-3
                "
              />
              <p className="text-sm text-gray-500 mt-2">Format: JPG, PNG, WEBP</p>
            </div>
            {/* Preview */}
            <div>
              <div
                className="
                  h-40
                  border
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  bg-gray-50
                "
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="
                      max-h-32
                      object-contain
                    "
                  />
                ) : (
                  <span className="text-gray-400">
                    Belum ada logo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg">
          {recordId ? "Update" : "Simpan"}
        </button>

      </form>

    </div>
  );
}