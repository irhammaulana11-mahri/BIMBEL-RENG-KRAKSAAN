import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { getMaterialsByCurriculum, createMaterial, updateMaterial,deleteMaterial } from "../../../../services/academic/materialService";
import MaterialCard from "../material/MaterialCard";
import MaterialTypeSelector from "../material/MaterialTypeSelector";
import MaterialFormView from "../material/MaterialFormView";
import { useConfirm } from "@/components/ui/confirmation";
import { useToast } from "../../../../hooks/useToast";


export default function CurriculumDetailView({ curriculum, onBack }) {
  const [materials, setMaterials] = useState([]);
  const [subTab, setSubTab] = useState("material");
  const [loading, setLoading] = useState(false);

  // Mode Tampilan Material Inline: 'list' | 'select_type' | 'form'
  const [materialMode, setMaterialMode] = useState("list");
  const [selectedType, setSelectedType] = useState("DOCUMENT");
  const [editingMaterial, setEditingMaterial] = useState(null);

  const confirm = useConfirm();
  const { showSuccess, showError } = useToast();

  const loadMaterials = useCallback(() => {
    if (curriculum?.id) {
      setLoading(true);
      getMaterialsByCurriculum(curriculum.id)
        .then(res => setMaterials(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [curriculum]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);


  const handleSaveMaterial = async (formData) => {
    try {
      setLoading(true);
      if (editingMaterial?.id) {
        await updateMaterial(editingMaterial.id, formData);
        showSuccess("Berhasil Memperbarui Materi.");
      } else {
        await createMaterial(formData);
        showSuccess("Berhasil Menambahkan Materi Baru.");
      }
      loadMaterials();
      setEditingMaterial(null);
      setMaterialMode("list");
    } catch (err) {
      showError(err.response?.data?.message || "Gagal Menyimpan Materi.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setSelectedType(material.material_type || "DOCUMENT");
    setMaterialMode("form");
  };


  const handleDeleteMaterial = async (id) => {
    const ok = await confirm.confirm({
      title: "Hapus Material Pembelajaran",
      message: "Apakah Anda yakin ingin menghapus material ini dari kurikulum? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus Material",
      confirmButtonClass: "bg-red-600 hover:bg-red-700",
    });

    if (!ok) return;

    try {
      confirm.setLoading(true);
      await deleteMaterial(id);
      showSuccess("Material berhasil dihapus.");
      loadMaterials();
    } catch (err) {
      showError(err.response?.data?.message || "Gagal menghapus material.");
    } finally {
      confirm.setLoading(false);
    }
  };

  // Mode Selector Tipe Material (Tambah Baru)
  if (materialMode === "select_type") {
    return (
      <MaterialTypeSelector
        curriculum={curriculum}
        onBack={() => setMaterialMode("list")}
        onSelectType={(type) => {
          setEditingMaterial(null);
          setSelectedType(type);
          setMaterialMode("form");
        }}
      />
    );
  }

  // Mode Form Isian Material (Tambah / Edit)
  if (materialMode === "form") {
    return (
      <MaterialFormView
        curriculum={curriculum}
        materialType={selectedType}
        initialData={editingMaterial}
        onBack={() => {
          if (editingMaterial) {
            setMaterialMode("list");
          } else {
            setMaterialMode("select_type");
          }
          setEditingMaterial(null);
        }}
        onSubmit={handleSaveMaterial}
        loading={loading}
      />
    );
  }


  // 3. Tampilan Mode Utama (Daftar Material)
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Detail Kurikulum */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="text-sm font-black text-gray-950">{curriculum.title}</h3>
            <p className="text-[13px] text-gray-400 font-bold">Semester {curriculum.semester} • Urutan {curriculum.order_no}</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setSubTab("material")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            subTab === "material" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Materi ({materials.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("quiz")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            subTab === "quiz" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Quiz & Tugas
        </button>
      </div>

      {/* Konten Material */}
      {subTab === "material" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Daftar Learning Resources</span>
            <button
              type="button"
              onClick={() => setMaterialMode("select_type")} // Memicu pemilihan tipe secara inline
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={14} /> + Upload Material
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Memuat materi...</div>
          ) : materials.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
              Belum ada materi atau file pembelajaran yang diunggah untuk bab ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {materials.map((mat) => (
                <MaterialCard
                  key={mat.id}
                  material={mat}
                  onDelete={handleDeleteMaterial}
                  onEdit={handleEditMaterial}
                  onPreview={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === "quiz" && (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
          Fitur Kuis & Evaluasi Belajar segera hadir.
        </div>
      )}
    </div>
  );
}