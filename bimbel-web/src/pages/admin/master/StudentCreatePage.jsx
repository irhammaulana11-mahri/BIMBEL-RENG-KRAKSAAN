import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import StudentForm from "../../../components/admin/master/student/StudentForm";
import StudentGuardianCard from "../../../components/admin/master/student/StudentGuardianCard";
import { createStudent } from "../../../services/admin/studentService";
import { getParent } from "../../../services/admin/parentService";
import Toast from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentIdFromUrl = searchParams.get("parent");

  const [loading, setLoading] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);
  const [parent, setParent] = useState(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Otomatis muat data wali murid jika ID dikirimkan melalui URL parameter
  useEffect(() => {
    if (parentIdFromUrl) {
      loadParent(parentIdFromUrl);
    }
  }, [parentIdFromUrl]);

  const loadParent = async (id) => {
    try {
      setParentLoading(true);
      const response = await getParent(id);
      setParent(response.data?.data || response.data);
    } catch (error) {
      console.error(error);
      showError("Data wali murid tidak ditemukan.");
    } finally {
      setParentLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    // Validasi: Wajib memilih orang tua / wali murid terlebih dahulu
    if (!parent) {
      showError("Silakan pilih Orang Tua / Wali murid terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...values,
        parent_id: parent.id, // Menggunakan ID dari state parent yang terpilih
      };

      await createStudent(payload);
      showSuccess("Murid berhasil didaftarkan.");
      
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error(error);
      showError(
        error.response?.data?.message ?? "Gagal mendaftarkan murid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card space-y-6">
      <Toast {...toast} onClose={hideToast} />

      {/* Header Page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Daftarkan Murid Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Lengkapi biodata murid untuk proses registrasi.</p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>

      {/* Grid Layout Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Kolom Kiri (2/3): Form Biodata Siswa */}
        <div className="xl:col-span-2">
          <StudentForm loading={loading} parent={parent} onSubmit={handleSubmit} />
        </div>

        {/* Kolom Kanan (1/3): Card Penanggung Jawab / Wali Murid */}
        <div className="xl:col-span-1">
          <StudentGuardianCard
            loading={parentLoading}
            parent={parent}
            onSelectParent={(selectedParent) => setParent(selectedParent)}
          />
        </div>

      </div>
    </div>
  );
}