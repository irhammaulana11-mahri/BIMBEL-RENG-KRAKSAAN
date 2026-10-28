import React, { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { Landmark, Save, UploadCloud, Link2, MapPin, Phone, Mail } from "lucide-react";
import { getCompanyProfile, createCompanyProfile, updateCompanyProfile } from "@/services/admin/website/companyProfileService";
import { uploadImage } from "@/services/admin/website/uploadService";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { getApiErrorMessage } from "@/utils/apiError";

export default function CompanyProfilePage() {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
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
        setLogoPreview(data.logo_url ? assetUrl(data.logo_url) : null);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
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
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      let payload = { ...form };
      if (logoFile) {
        const imageUrl = await uploadImage(logoFile);
        payload.logo_url = imageUrl;
      }
      if (recordId) {
        await updateCompanyProfile(recordId, payload);
        showSuccess("Profil institusi berhasil diperbarui.");
      } else {
        const res = await createCompanyProfile(payload);
        setRecordId(res.data.data.id);
        showSuccess("Profil institusi berhasil disimpan.");
      }
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menyimpan perubahan profil."));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-base text-gray-500 font-medium gap-2">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        Menarik konfigurasi profil lembaga...
      </div>
    );
  }

  return (
    // PERBAIKAN: Menggunakan standarisasi wadah luar lega & bersih mengalir ke bawah
    <div className="bg-white p-6 rounded-xl shadow">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <div className="p-6">
      
      {/* Header Halaman (text-3xl) */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Profil Lembaga</h1>
          <p className="text-base text-gray-500 mt-1">
            Konfigurasi identitas resmi Bimbel Reng Kraksaan. Data ini disinkronkan langsung ke halaman publik dan cetak invoice kuitansi.
          </p>
        </div>
      </div>

      {/* Kontainer Utama Form Tunggal Premium */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        
        {/* Bagian 1: Identitas & Kontak Utama */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-blue-600" /> Identitas & Kontak Lembaga
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nama Resmi Perusahaan / Bimbel</label>
              <input required name="company_name" value={form.company_name} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: Bimbel Reng Kraksaan"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Resmi Operational</label>
              <input type="email" required name="email" value={form.email} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="admin@rengkraksaan.com"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nomor Telepon Kantor (Telephone)</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="(0335) xxxxxx"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Hotline WhatsApp Gateway</label>
              <input required name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="081xxxxxxxxx"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Alamat Fisik Markas Pusat</label>
            <textarea rows="3" required name="address" value={form.address} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500" placeholder="Tuliskan alamat lengkap beserta ruko / gedung cabang utama..."/>
          </div>
        </div>

        {/* Bagian 2: Koordinat Spasial & Peta */}
        <div className="p-6 space-y-4 bg-slate-50/30">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Pemetaan Koordinat Kantor Pusat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Garis Lintang (Latitude)</label>
              <input required name="latitude" value={form.latitude} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="-7.812345"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Garis Bujur (Longitude)</label>
              <input required name="longitude" value={form.longitude} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="113.412345"/>
            </div>
          </div>
        </div>

        {/* Bagian 3: Tautan Eksternal & Media Sosial */}
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-blue-600" /> Tautan Media Sosial & Web Publik
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">URL Website Portal</label>
              <input name="website_url" value={form.website_url} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="https://rengkraksaan.com"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">URL Halaman Facebook</label>
              <input name="facebook_url" value={form.facebook_url} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="https://facebook.com/x"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">URL Akun Instagram</label>
              <input name="instagram_url" value={form.instagram_url} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="https://instagram.com/x"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">URL Channel YouTube</label>
              <input name="youtube_url" value={form.youtube_url} onChange={handleChange} className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 font-mono" placeholder="https://youtube.com/x"/>
            </div>
          </div>
        </div>

        {/* Bagian 4: Manajemen Visual Logo Institusi */}
        <div className="p-6 space-y-4 bg-slate-50/30">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
            Berkas Master Logo Perusahaan
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kotak Seret & Klik File */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-white hover:bg-gray-50/50 transition-colors cursor-pointer relative group flex flex-col justify-center items-center min-h-[160px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm font-bold text-gray-700">Pilih atau seret logo institusi ke sini</p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Format diterima: JPG, PNG, WEBP (Rekomendasi rasio kotak)</p>
              {logoFile && (
                <p className="text-xs font-black text-emerald-600 mt-2 bg-emerald-50 py-1 px-3 rounded-lg inline-block">Berkas siap unggah: {logoFile.name}</p>
              )}
            </div>
            {/* Area Pratinjau Logo */}
            <div className="h-[160px] border border-gray-200 rounded-2xl flex items-center justify-center bg-white p-4 shadow-inner">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Company Logo Preview"
                  className="max-h-32 max-w-full object-contain mix-blend-multiply"
                />
              ) : (
                <span className="text-sm font-bold text-gray-400 italic">
                  Belum ada master logo terunggah
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bagian 5: Bilah Tombol Aksi Kerja Akhir */}
        <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={submitLoading} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> 
            {submitLoading ? "Sedang Menyimpan..." : recordId ? "Perbarui Profil Lembaga" : "Simpan Berkas Identitas"}
          </button>
        </div>

      </form>
    </div>
  </div>
  );
}