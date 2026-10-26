import React, { useState, useEffect, useMemo } from "react";
import { X, Search, UserCheck, Users } from "lucide-react";
import { getParents } from "../../../../services/admin/parentService";
import MiniDataTable from "../../../ui/minitable/MiniDataTable"; // Import komponen reusable

export default function ParentPickerModal({ open, onClose, onSelect }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (open) {
      fetchParents();
      setSearch("");
      setCurrentPage(1);
    }
  }, [open]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const res = await getParents();
      const data = res.data?.data || res.data || [];
      setParents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuat data orang tua/wali:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter pencarian (Live Search)
  const filteredParents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return parents;

    return parents.filter((p) => {
      const name = (p.full_name || p.parent_name || "").toLowerCase();
      const phone = (p.phone || p.user?.phone || "").toLowerCase();
      const email = (p.email || p.user?.email || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [parents, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Slicing data untuk pagination lokal
  const totalItems = filteredParents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredParents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredParents, currentPage, itemsPerPage]);

  // Konfigurasi Kolom Tabel Mini
  const columns = [
    {
      header: "Nama Wali",
      accessor: "full_name",
      cellClassName: "font-bold text-gray-900 max-w-[160px] truncate",
      render: (row) => row.full_name || row.parent_name || "-",
    },
    {
      header: "No HP",
      accessor: "phone",
      cellClassName: "font-mono text-xs text-gray-600 whitespace-nowrap",
      render: (row) => row.phone || row.user?.phone || "-",
    },
    {
      header: "Email",
      accessor: "email",
      cellClassName: "text-gray-600 text-xs max-w-[160px] truncate",
      render: (row) => row.email || row.user?.email || "-",
    },
    {
      header: "Jumlah Anak",
      headerAlign: "center",
      align: "center",
      cellClassName: "font-bold text-blue-600 text-xs whitespace-nowrap",
      render: (row) => `${row.students?.length ?? row.students_count ?? 0} Anak`,
    },
    {
      header: "Aksi",
      headerAlign: "center",
      align: "center",
      cellClassName: "whitespace-nowrap",
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            onSelect(row);
            onClose();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <UserCheck size={13} /> Pilih
        </button>
      ),
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 tracking-tight">Pilih Orang Tua / Wali</h3>
              <p className="text-xs text-gray-400 mt-0.5">Cari dan pilih data wali murid terdaftar untuk dikaitkan dengan siswa.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="py-4">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama, No HP, atau Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Mini Data Table Reusable */}
        <MiniDataTable
          columns={columns}
          data={currentData}
          loading={loading}
          emptyMessage="Data orang tua/wali tidak ditemukan."
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            onPageChange: (page) => setCurrentPage(page),
          }}
        />

      </div>
    </div>
  );
}