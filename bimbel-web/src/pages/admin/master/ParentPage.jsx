import { useEffect, useState } from "react";
import { Search,Eye,Pencil,Trash2,Users, Import, } from "lucide-react";
import { getParents,updateParent,deleteParent, } from "../../../services/parentService";
import ParentModal from "../../../components/admin/parent/ParentModal";
import ParentPreview from "../../../components/admin/parent/ParentPreview";
import ParentTable from "../../../components/admin/parent/ParentTable";

export default function ParentPage() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [previewParent, setPreviewParent] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [childFilter, setChildFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    from: 0,
    to: 0,
    total: 0,
    current_page: 1,
    last_page: 1,
    next_page_url: null,
    prev_page_url: null,
  });

  const totalParents = parents.length;
  const activeParents = parents.filter((p) => p.user?.is_active).length;
  const totalStudents = parents.reduce((sum, p) => sum + (p.students_count || 0),0);
  const noStudent = parents.filter((p) => p.students_count === 0).length;


  const loadParents = async () => {
    const res = await getParents({
      page: currentPage,
      search,
      status: statusFilter,
      child: childFilter,
    });
    console.log({
  page: currentPage,
  search,
  status: statusFilter,
  child: childFilter,
});
    setParents(res.data.data || []);
    setPagination(res.data.meta || []);
  };

  useEffect(() => {
    loadParents();
  }, [currentPage, search,statusFilter,childFilter]);


  const handleEdit = (parent) => {
    setSelectedParent(parent);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    try {
      setLoading(true);

      if (selectedParent) {
        await updateParent(selectedParent.id,form);
      } else {
      }
      await loadParents();
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus data orang tua?"))
      return;
    await deleteParent(id);
    loadParents();
  };

  function StatCard({title,value,}) {
    return (
      <div className="bg-white border rounded-2xl p-5 shadow">
        <div className="text-gray-500 text-sm">{title}</div>
        <div className="text-3xl font-bold mt-2">{value}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <>
  
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Parent Management</h1>
            <p className="text-gray-500">Kelola data orang tua</p>
            <div className="text-sm text-gray-500">Data orang tua berasal dari konversi lead yang telah disetujui.</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Parent" value={totalParents}/>
          <StatCard title="Parent Aktif" value={activeParents}/>
          <StatCard title="Total Anak" value={totalStudents}/>
          <StatCard title="Belum Punya Anak" value={noStudent}/>
        </div>
        
          <div className="bg-white rounded-2xl border border-gray-200 shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6">
              <div className="w-full lg:w-80">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari orang tua..."
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="flex gap-3 justify-end">
<select
  value={statusFilter}
  onChange={(e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }}
  className="rounded-xl border px-4 py-3"
>
  <option value="">Semua Status</option>
  <option value="aktif">Aktif</option>
  <option value="nonaktif">Nonaktif</option>
</select>
<select
  value={childFilter}
  onChange={(e) => {
    setChildFilter(e.target.value);
    setCurrentPage(1);
  }}
  className="rounded-xl border px-4 py-3"
>
  <option value="">Semua</option>
  <option value="yes">Punya Anak</option>
  <option value="no">Belum Punya Anak</option>
</select>              </div>

            </div>
            <ParentTable data={parents} onPreview={setPreviewParent} onEdit={handleEdit} onDelete={handleDelete}/>  
            
            <div className="border-t border-gray-100 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Menampilkan {pagination?.from ?? 0}
                  -
                  {pagination?.to ?? 0}
                  dari {pagination?.total ?? 0} data
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!pagination?.prev_page_url}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: pagination?.last_page || 1 },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={!pagination?.next_page_url}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div> 
          </div>
          
          <ParentModal open={modalOpen} onClose={() => setModalOpen(false)}
              data={selectedParent} onSubmit={handleSubmit} loading={loading}/>
          
          <ParentPreview parent={previewParent} onClose={() => setPreviewParent(null)}/>
      </div>
      </>
    </div>
  );
}