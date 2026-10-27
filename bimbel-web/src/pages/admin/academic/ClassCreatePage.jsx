import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Save, ShieldCheck, CheckCircle2, Info, Sparkles } from "lucide-react";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { createTentor } from "../../../services/admin/tentorService";
import SubjectPickerModal from "../../../components/admin/master/tentor/SubjectPickerModal";
import SelectedSubjectCards from "../../../components/admin/master/tentor/SelectedSubjectCards";

export default function ClassCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [formData, setFormData] = useState({
    // 1. Data Akses Akun Login
    name: "",
    email: "",
    phone: "",
    password: "",

    // 2. Biodata & Kualifikasi Tentor
    nik: "",
    birth_date: "",
    gender: "L",
    education: "S1 Pendidikan",
    specialization: "SAINTEK",
    address: "",
    is_active: true,

    // 3. Array Selected Subjects
    selectedSubjects: [],
  });

  // Handler Toggle Subject
  const handleToggleSubject = (subject) => {
    setFormData((prev) => {
      const exists = prev.selectedSubjects.some((s) => s.id === subject.id);
      return {
        ...prev,
        selectedSubjects: exists
          ? prev.selectedSubjects.filter((s) => s.id !== subject.id)
          : [...prev.selectedSubjects, subject],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        nik: formData.nik,
        birth_date: formData.birth_date,
        gender: formData.gender,
        education: formData.education,
        specialization: formData.specialization,
        address: formData.address,
        is_active: formData.is_active,
        subject_ids: formData.selectedSubjects.map((s) => s.id),
      };

      await createTentor(payload);
      showSuccess("Tentor baru dan sinkronisasi mapel berhasil didaftarkan!");
      setTimeout(() => navigate("/admin/tentors"), 1500);
    } catch (err) {
      showError(err.response?.data?.message || "Gagal mendaftarkan tentor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Header Page */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Tambah Tentor Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lengkapi biodata tentor, akun login, dan kompetensi mata pelajaran.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* KOLOM KIRI (3/4): SEKSI 1, 2, & 3 */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* SEKSI 1: DATA AKUN LOGIN */}
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
                <ShieldCheck className="text-blue-600" size={18} />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">1. Data Akses Akun Login</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap Tentor</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="Contoh: Fitriyah Dewi, S.Pd."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Email (Username Login)</label>
                  <input
                    type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="fitriyah@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">No. WhatsApp / HP</label>
                  <input
                    type="text" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Password Default</label>
                  <input
                    type="password" required value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 2: BIODATA TENTOR */}
            <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2.5">
                <User className="text-blue-600" size={18} />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">2. Biodata & Kualifikasi Tentor</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">NIK</label>
                  <input
                    type="text" value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="351301..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Lahir</label>
                  <input
                    type="date" value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Pendidikan Terakhir</label>
                  <input
                    type="text" value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="S1 Bahasa Inggris"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kluster Spesialisasi</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SAINTEK">Saintek (IPA/MTK/Sains)</option>
                    <option value="SOSHUM">Soshum (IPS/Sosial)</option>
                    <option value="BAHASA">Bahasa & Literasi</option>
                    <option value="UMUM">Umum / Semua Jenjang</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Keaktifan</label>
                  <select
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="true">Aktif (Dapat di-plotting)</option>
                    <option value="false">Nonaktif (Terikat arsip)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alamat Domisili</label>
                  <input
                    type="text" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500"
                    placeholder="Jl. Merdeka No. 45, Kraksaan"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 3: KOMPETENSI MENGAJAR (CARDS + TRIGGER MODAL) */}
            <SelectedSubjectCards
              selectedSubjects={formData.selectedSubjects}
              onRemove={handleToggleSubject}
              onOpenModal={() => setOpenModal(true)}
            />

          </div>

          {/* KOLOM KANAN (1/4): RINGKASAN STICKY CARD (SEKSI 4) */}
          <div className="xl:col-span-1 space-y-4 xl:sticky xl:top-6">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">4. Ringkasan Registrasi</h3>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  formData.is_active 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                }`}>
                  {formData.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Tentor</p>
                  <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.name || "-"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK</p>
                  <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.nik || "-"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat</p>
                  <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.address || "-"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendidikan Terakhir</p>
                  <p className="font-bold text-slate-100 text-sm truncate mt-0.5">{formData.education || "-"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Login</p>
                  <p className="font-mono text-slate-300 truncate mt-0.5">{formData.email || "-"}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kluster Spesialisasi</p>
                  <span className="inline-block font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20 mt-1">
                    {formData.specialization}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mapel Dipilih</p>
                    <span className="font-bold text-emerald-400 text-xs">
                      {formData.selectedSubjects.length} Mata Pelajaran
                    </span>
                  </div>

                  {formData.selectedSubjects.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Belum ada mapel terpilih</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {formData.selectedSubjects.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{sub.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Akun login user dan sinkronisasi mapel akan diproses langsung secara otomatis.</span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Save size={16} />
                  {loading ? "Menyimpan Data..." : "Simpan Data Tentor"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-colors text-center cursor-pointer"
                >
                  Batal
                </button>
              </div>

            </div>
          </div>

        </div>
      </form>

      {/* Render Subject Picker Modal */}
      <SubjectPickerModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        selectedSubjects={formData.selectedSubjects}
        onSelect={handleToggleSubject}
      />
    </div>
  );
}