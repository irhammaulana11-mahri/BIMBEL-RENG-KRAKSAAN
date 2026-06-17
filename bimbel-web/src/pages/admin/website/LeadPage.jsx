import { useEffect, useState } from "react";
import { Eye,Trash2,} from "lucide-react";
import { getLeads,deleteLead,} from "../../../services/leadService";
import LeadDetailModal from "../../../components/admin/lead/LeadDetailModal";
import LeadStatusBadge from "../../../components/admin/lead/LeadStatusBadge";

export default function LeadPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getLeads();
      setLeads(response.data?.data || response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setSelected(item);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Hapus lead ini?"
      );

    if (!confirmDelete)
      return;

    try {
      await deleteLead(id);

      loadData();
    } catch (err) {
      console.error(err);

      alert(
        "Gagal menghapus lead"
      );
    }
  };

  const totalLead = leads.length;
  const newLead = leads.filter((x) => x.status === "NEW").length;
  const followUp = leads.filter((x) => x.status === "FOLLOW_UP").length;
  const registered = leads.filter((x) => x.status === "REGISTERED").length;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
    <>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-gray-500">Kelola calon siswa yang masuk dari website</p>
        </div>

        {/* Statistic */}

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-gray-500">Total Leads</p>
            <h2 className="text-3xl font-bold">{totalLead}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-gray-500">New</p>
            <h2 className="text-3xl font-bold text-blue-600">{newLead}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-gray-500">Follow Up</p>
            <h2 className="text-3xl font-bold text-orange-600">{followUp}</h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow">
            <p className="text-gray-500">Registered</p>
            <h2 className="text-3xl font-bold text-green-600">{registered}</h2>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Jenjang</th>
                <th className="p-4 text-left">Paket</th>
                <th className="p-4 text-left">Telepon</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Tanggal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center p-8">Loading...</td>
                </tr>
              )}

              {!loading && leads.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4 font-medium">{item.full_name}</td>
                      <td className="p-4">{item.education_level}</td>
                      <td className="p-4">{item.package?.package_name || "-"}</td>
                      <td className="p-4">{item.phone}</td>
                      <td className="text-center">
                        <LeadStatusBadge status={item.status}/>
                      </td>
                      <td className="text-center">{new Date(item.created_at).toLocaleDateString("id-ID")}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleView(item)} className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Eye size={18}/>
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-red-100 text-red-600">
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailModal open={openModal} onClose={() => setOpenModal(false)} data={selected} onSuccess={loadData}/>
    </>
    </div>
  );
}