import { useEffect, useState } from "react";
import { Phone,GraduationCap,Package,User,UserCheck,MessageCircle, } from "lucide-react";
import { updateLead,convertLead } from "../../../services/leadService";
import LeadStatusBadge from "../../../components/admin/lead/LeadStatusBadge";


export default function LeadDetailModal({open,onClose,data,onSuccess,}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("NEW");
  useEffect(() => {
    if (data) {
      setStatus(data.status || "NEW");
    }
  }, [data]);

  if (!open || !data)
    return null;

  const handleSubmit = async () => {
      try {
        setLoading(true);
        await updateLead(data.id,{...data,status,});
        onSuccess();
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  const handleConvert = async () => {
    if (status !== "CONTACTED") {
      alert("Lead harus berstatus CONTACTED terlebih dahulu");
      return;
    }

    const confirmConvert = window.confirm("Konversi lead menjadi akun parent?");

    if (!confirmConvert) return;
      try {
        setLoading(true);
        const response = await convertLead(data.id);
        const tempPassword = response.data?.temporary_password;
        alert(`Lead berhasil dikonversi.\n\nPassword sementara:\n${tempPassword}`);
        onSuccess?.();
        onClose();
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Gagal mengkonversi lead");
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">Detail Lead</h2>
            <p className="text-sm text-slate-500">
              Informasi calon siswa
            </p>
          </div>

          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
        </div>
        
        {/*STATUS */}
        <div className="flex justify-between items-center bg-slate-50 p-4">
          <div>
            <p className="text-sm text-slate-500">Status Lead</p>
            <LeadStatusBadge status={data.status}/>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Tanggal Register</p>
            <p className="font-medium">{new Date(data.created_at).toLocaleDateString("id-ID")}</p>
          </div>
        </div>

        {/*BODY */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={18} />
              <span className="font-semibold">Orang Tua / Wali</span>
            </div>
            <p className="text-slate-700">{data.parent_name}</p>
          </div>

          <div className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={18} />
              <span className="font-semibold">Nama Siswa</span>
            </div>
            <p className="text-slate-700">{data.student_name}</p>
          </div>

          <div className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={18} />
              <span className="font-semibold">
                WhatsApp
              </span>
            </div>

            <p>{data.phone}</p>
          </div>

          <div className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={18} />
              <span className="font-semibold">Jenjang</span>
            </div>
            <p>{data.education_level}</p>
          </div>

          <div className="border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={18} />
              <span className="font-semibold">Paket Dipilih</span>
            </div>
            <p>{data.package?.package_name || "-"}</p>
          </div>         

          <div>
            <label className="font-semibold">Catatan</label>
            <div className="mt-2 bg-slate-50 border rounded-xl p-4 min-h-[100px]">
              {data.notes || "Tidak ada catatan"}
            </div>
          </div>

          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-xl p-3">
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="REGISTERED">REGISTERED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between mt-6 border-t pt-4">
          <a
            href={`https://wa.me/${data.phone.replace(/^0/, "62")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <div className="flex gap-3">
            <button onClick={handleConvert} disabled={status !== "CONTACTED"} className={`px-4 py-2 rounded-xl text-white transition
                ${data.status === "CONTACTED" ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              Convert Lead
            </button>            
            <button onClick={handleSubmit} disabled={loading || data.status === "REGISTERED"} className={`px-4 py-2 text-white rounded-xl
                ${data.status === "REGISTERED" ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
            >
              {loading ? "Menyimpan..." : data.status === "REGISTERED" ? "Sudah Terdaftar" : "Update Status"}
            </button>         
          </div>
            
        </div>
      </div>
    </div>
  );
}