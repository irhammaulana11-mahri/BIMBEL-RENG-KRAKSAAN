import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getPackages } from "../../services/packageService";
import { createLead } from "../../services/leadService";

export default function LeadRegisterPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    parent_name: "",
    phone: "",
    student_name: "",
    education_level: "",
    package_id: "",
    notes: "",
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await getPackages();
      const packageData = res.data.data || [];
      setPackages(packageData);

      const selectedPackage = searchParams.get("package");

      if (selectedPackage) {
        setForm((prev) => ({...prev,package_id: selectedPackage,}));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({...form,[e.target.name]:e.target.value,});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await createLead({...form,status: "NEW",});
      alert(
        "Pendaftaran berhasil. Tim kami akan segera menghubungi Anda."
      );

      navigate("/");
    } catch (err) {
      console.error(err);

      alert(
        "Gagal mengirim pendaftaran"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-50 min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">Daftar Bimbel</h1>
            <p className="text-gray-500 mt-3">
              Isi formulir berikut dan tim kami akan segera menghubungi Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-medium">Nama Orang Tua / Wali</label>
              <input type="text" name="parent_name" value={form.parent_name} onChange={handleChange}
                  required className="w-full border rounded-xl p-3 mt-2"
              />
            </div>

            <div>
              <label className="font-medium">Nomor WhatsApp</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} required 
                    className="w-full border rounded-xl p-3 mt-2"/>
            </div>

            <div>
              <label className="font-medium">Nama Siswa</label>
              <input type="text" name="student_name" value={form.student_name} onChange={handleChange}
                required className="w-full border rounded-xl p-3 mt-2"
              />
            </div>

            <div>
              <label className="font-medium">Jenjang Pendidikan</label>
              <select name="education_level" value={form.education_level} onChange={handleChange} required 
                    className="w-full border rounded-xl p-3 mt-2">
                <option value="">Pilih Jenjang</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>

            <div>
              <label className="font-medium">Paket</label>
              <select name="package_id" value={form.package_id} onChange={handleChange} className="w-full 
                    border rounded-xl p-3 mt-2">
                <option value="">Pilih Paket</option>
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>{item.package_name}</option>
                    ))}
              </select>
            </div>

            <div>
              <label className="font-medium">Catatan Tambahan</label>
              <textarea rows={4} name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded-xl p-3 mt-2"/>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold">
              {loading ? "Mengirim..." : "Daftar Sekarang"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}