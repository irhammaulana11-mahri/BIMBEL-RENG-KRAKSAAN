import React from "react";
import { Eye, Pencil, Trash2, Clock, ExternalLink, Play } from "lucide-react";
import { MATERIAL_TYPES } from "../../../../components/constants/material.constants";
import { openMaterialProtectedPreview } from "../../../../services/academic/materialService";
import { useAuth } from "../../../../context/AuthContext"; // Ambil data user aktif


export default function MaterialCard({ material, onEdit, onDelete }) {
  const { user } = useAuth();
  const typeConfig = MATERIAL_TYPES[material.material_type] || MATERIAL_TYPES.DOCUMENT;
  const Icon = typeConfig.icon;

  return (
    <div className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-2xs transition-all space-y-3 group">
      {/* Header Info Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border ${typeConfig.badgeBg} shrink-0`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${typeConfig.badgeBg}`}>
                {typeConfig.badgeLabel}
              </span>
              <span className="text-[10px] font-mono text-gray-400">Urutan #{material.sort_order || 1}</span>
            </div>
            <h4 className="text-xs font-black text-gray-950 mt-1 group-hover:text-blue-600 transition-colors">
              {material.title}
            </h4>
            {material.description && (
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                {material.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info & Dynamic Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
        {material.duration_minutes > 0 ? (
          <span className="flex items-center gap-1 font-bold text-gray-600">
            <Clock size={12} className="text-blue-600" /> {material.duration_minutes} Mnt
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1">
          {/* AKSI TIPE VIDEO */}
          {material.material_type === "VIDEO" && material.video_url && (
            <a
              href={material.video_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Play size={12} /> Play Video
            </a>
          )}

          {/* AKSI TIPE TAUTAN LINK */}
          {material.material_type === "LINK" && material.external_url && (
            <a
              href={material.external_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink size={12} /> Buka Link
            </a>
          )}

          {/* AKSI TIPE DOKUMEN / GAMBAR / PRESENTASI */}
          {material.file_path && material.material_type !== "VIDEO" && material.material_type !== "LINK" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // 🟢 Kirim objek user aktif untuk Watermark pada tab baru
                openMaterialProtectedPreview(material.file_path, material.title, user);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Eye size={12} /> Protected Preview
            </button>
          )}

          {/* 🟢 TOMBOL EDIT (Penting: e.stopPropagation & onEdit dipanggil tepat) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(material);
            }}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
            title="Edit Material"
          >
            <Pencil size={14} />
          </button>

          {/* 🟢 TOMBOL DELETE */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(material.id);
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
            title="Hapus Material"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}