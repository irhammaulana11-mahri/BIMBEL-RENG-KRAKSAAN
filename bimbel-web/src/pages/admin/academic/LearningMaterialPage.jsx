import React, { useState } from "react";
import { Plus, Search, BookOpen, Lock, DownloadCloud, FileText } from "lucide-react";
import MaterialListTable from "../../../components/admin/master/subject/MaterialListTable";
import MaterialModal from "../../../components/admin/master/subject/MaterialModal";

const PremiumStatCard = ({ title, value, desc, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-black text-gray-950 font-mono tracking-tight">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{desc}</p>
    </div>
    <div className={`p-4 rounded-2xl transition-transform group-hover:scale-105 duration-300 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function LearningMaterialPage() {
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(false);

  // MOCK DATA: Berkas modul materi yang terikat dengan batasan paket
  const [mockMaterials, setMockMaterials] = useState([
    {
      id: 1,
      title: "Kumpulan Rumus Cepat Turunan & Integral",
      subject_name: "Matematika Peminatan",
      education_level: "12 SMA",
      file_name: "rumus_cepat_kalkulus_v2.pdf",
      file_size: "4.2 MB",
      allowed_package_id: 1,
      allowed_package_name: "Intensif SMA 12 (Rumah)",
      download_count: 45
    },
    {
      id: 2,
      title: "Modul Ringkasan Struktur Sosial & Konflik",
      subject_name: "Sosiologi Dasar",
      education_level: "10 UTBK",
      file_name: "sosiologi_bab3_konflik.pdf",
      file_size: "2.8 MB",
      allowed_package_id: 2,
      allowed_package_name: "Reguler SMP 9 (Bimbel)",
      download_count: 12
    },
    {
      id: 3,
      title: "Bank Soal & Pembahasan Fisika Kuantum",
      subject_name: "Fisika Klasik",
      education_level: "12 SMA",
      file_name: "bank_soal_kuantum_2026.pdf",
      file_size: "5.1 MB",
      allowed_package_id: 1,
      allowed_package_name: "Intensif SMA 12 (Rumah)",
      download_count: 29
    }
  ]);

  const handleAdd = () => {
    setSelectedMaterial(null);
    setModalOpen(true);
  };

  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus modul materi ini? Hak unduh tentor & siswa otomatis dicabut.")) {
      setMockMaterials(mockMaterials.filter(m => m.id !== id));
    }
  };

  const handleSubmit = (formData) => {
    setModalOpen(false);
  };

  const filteredMaterials = mockMaterials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.subject_name.toLowerCase().includes(search.toLowerCase());
    const matchesPackage = packageFilter === "" || m.allowed_package_id === parseInt(packageFilter);
    return matchesSearch && matchesPackage;
  });

  const totalDownloads = mockMaterials.reduce((sum, m) => sum + m.download_count, 0);
  const protectedCount = mockMaterials.filter(m => m.allowed_package_id).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="p-6">
        
        {/* Header Standar (text-3xl) + Tombol Sejajar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-950 tracking-tight">Learning Materials</h1>
            <p className="text-base text-gray-500 mt-1">
              Manajemen gudang berkas silabus, bank soal PDF, dan proteksi unduh file berbasis paket siswa.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-xs self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Upload Modul Baru
          </button>
        </div>

        {/* Row Kumpulan Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PremiumStatCard title="Total File Modul" value={mockMaterials.length} desc="E-Book berkas PDF aktif di server" icon={BookOpen} colorClass="bg-slate-50 text-slate-600" />
          <PremiumStatCard title="Akses Paket Khusus" value={`${protectedCount}`} desc="Diproteksi hanya untuk siswa premium" icon={Lock} colorClass="bg-amber-50 text-amber-700" />
          <PremiumStatCard title="Total Unduhan" value={`${totalDownloads}`} desc="Diunduh oleh tentor & siswa via Mobile" icon={DownloadCloud} colorClass="bg-emerald-50 text-emerald-700" />
        </div>

        {/* Wadah Utama Tunggal untuk Filter, Tabel, dan Pagination */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Toolbar Pencarian & Filter Terpadu */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-gray-50/50 border-b border-gray-100">
            <div className="w-full lg:w-80">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul materi / mapel..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 justify-end w-full lg:w-auto">
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white font-semibold text-gray-700"
              >
                <option value="">Semua Tingkat Akses Paket</option>
                <option value="1">Intensif SMA 12 (Rumah)</option>
                <option value="2">Reguler SMP 9 (Bimbel)</option>
              </select>
            </div>
          </div>

          {/* Render Tabel Langsung di Sini */}
          <MaterialListTable 
            data={filteredMaterials} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />

          {/* Footer Pagination Terpadu */}
          <div className="border-t border-gray-100 p-5 bg-gray-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <p className="text-gray-600 font-medium">
                Menampilkan <span className="text-gray-900 font-bold">1</span> - <span className="text-gray-900 font-bold">{filteredMaterials.length}</span> dari <span className="text-gray-900 font-bold">{filteredMaterials.length}</span> item modul dokumen
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Prev</button>
                <button className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white">1</button>
                <button disabled className="px-4 py-2 border rounded-lg text-gray-700 bg-white font-bold opacity-40 text-sm">Next</button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Form */}
        <MaterialModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          data={selectedMaterial} 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}