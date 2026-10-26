import React, { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown, ChevronRight, MoreVertical, Pencil, PlusCircle, Power, CheckCircle } from "lucide-react";
import CurriculumEmptyState from "./CurriculumEmptyState";

export default function CurriculumListView({ 
  curriculums = [], 
  onAdd, 
  onSelectDetail, 
  onEdit, 
  onToggleStatus 
}) {
  const [openSemesters, setOpenSemesters] = useState({ 1: false });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Auto-close dropdown saat klik di luar menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSemester = (sem) => {
    setOpenSemesters((prev) => ({ ...prev, [sem]: !prev[sem] }));
  };

  // Grouping Berdasarkan Semester
  const groupedBySemester = curriculums.reduce((acc, curr) => {
    const sem = curr.semester || 1;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Curriculum Framework</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
        >
          <Plus size={14} /> Tambah Topik
        </button>
      </div>

      {Object.keys(groupedBySemester).length === 0 ? (
        <CurriculumEmptyState onAdd={onAdd} />
      ) : (
        Object.entries(groupedBySemester).map(([semester, items]) => {
          const isOpen = openSemesters[semester] ?? false;

          return (
            <div key={semester} className="border border-gray-100 rounded-2xl bg-white shadow-2xs">
              
              {/* Header Accordion Semester */}
              <div
                onClick={() => toggleSemester(semester)}
                className="p-3.5 bg-slate-50/80 hover:bg-slate-100/60 flex items-center justify-between cursor-pointer rounded-t-2xl border-b border-gray-100 select-none transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    SEMESTER {semester}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {items.length} Topik
                  </span>
                </div>
              </div>

              {/* Body Item Topik / BAB */}
              {isOpen && (
                <div className="divide-y divide-gray-50">
                  {items.map((curr, idx) => {
                    const isActive = curr.is_active ?? true;
                    const isLastItem = idx === items.length - 1; // Deteksi item paling bawah

                    return (
                      <div
                        key={curr.id}
                        className={`p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group relative ${
                          !isActive ? "bg-slate-50/40" : ""
                        }`}
                      >
                        {/* Judul & Detail BAB */}
                        <div
                          onClick={() => onSelectDetail(curr)}
                          className="flex items-center gap-3.5 flex-1 cursor-pointer pr-4"
                        >
                          <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                            isActive 
                              ? "bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white" 
                              : "bg-gray-200 text-gray-400"
                          }`}>
                            {curr.order_no || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {/* 🟢 PERBAIKAN 1: Menghapus line-through, diganti warna redup agar tidak bertabrakan dengan menu */}
                              <h4 className={`text-xs font-black transition-colors ${
                                isActive ? "text-gray-900 group-hover:text-blue-600" : "text-gray-400"
                              }`}>
                                {curr.title}
                              </h4>

                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                                isActive 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-red-50 text-red-600 border-red-200"
                              }`}>
                                {isActive ? "Aktif" : "Non-Aktif"}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              BAB-{curr.order_no || idx + 1}
                            </p>
                          </div>
                        </div>

                        {/* Akses & Kebab Menu */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {curr.materials_count || 0} Material
                          </span>

                          <div className="relative" ref={activeMenuId === curr.id ? menuRef : null}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === curr.id ? null : curr.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* 🟢 PERBAIKAN 2: Posisi Dropdown Otomatis (Atas/Bawah) & z-index Tinggi */}
                            {activeMenuId === curr.id && (
                              <div 
                                className={`absolute right-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-1.5 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95 ${
                                  isLastItem ? "bottom-8" : "top-8"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onEdit(curr); 
                                    setActiveMenuId(null); 
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2 text-gray-700 cursor-pointer"
                                >
                                  <Pencil size={14} className="text-amber-500" /> Edit Topik
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onSelectDetail(curr); 
                                    setActiveMenuId(null); 
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2 text-gray-700 cursor-pointer"
                                >
                                  <PlusCircle size={14} className="text-blue-500" /> Tambah Materi
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onToggleStatus(curr); 
                                    setActiveMenuId(null); 
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer ${
                                    isActive ? "text-red-600 hover:bg-red-50/50" : "text-green-600 hover:bg-green-50/50"
                                  }`}
                                >
                                  {isActive ? (
                                    <>
                                      <Power size={14} className="text-red-500" /> Non-Aktifkan
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={14} className="text-green-500" /> Aktifkan
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}