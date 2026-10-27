import React from "react";
import { FileText, PlayCircle, Link2, Image, Presentation, CheckCircle2, ExternalLink } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { openMaterialProtectedPreview } from "@/services/academic/materialService";
import { MATERIAL_TYPE } from "@/services/student/learningService";
import { formatSessionDate } from "@/services/parent/parentService";

const ICONS = { DOCUMENT: FileText, PRESENTATION: Presentation, IMAGE: Image, VIDEO: PlayCircle, LINK: Link2 };

// Buka materi: dokumen lewat penampil terlindungi, video/tautan di tab baru
function openMaterial(material, user) {
  if (material.material_type === "VIDEO" && material.video_url) return window.open(material.video_url, "_blank", "noopener,noreferrer");
  if (material.material_type === "LINK" && material.external_url) return window.open(material.external_url, "_blank", "noopener,noreferrer");
  if (material.file_path) return openMaterialProtectedPreview(material, user);
  if (material.video_url || material.external_url) window.open(material.video_url || material.external_url, "_blank", "noopener,noreferrer");
}

const canOpenMaterial = (m) => Boolean(m.file_path || m.video_url || m.external_url);

export default function MaterialItem({ material, compact = false }) {
  const { user } = useAuth();
  const Icon = ICONS[material.material_type] || FileText;
  const openable = canOpenMaterial(material);

  return (
    <div className={`flex items-start justify-between gap-3 ${compact ? "py-2" : "p-3 border border-gray-100 rounded-xl bg-white"}`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0"><Icon size={18} /></div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm">{material.title}</p>
          <p className="text-[11px] text-gray-400">
            {MATERIAL_TYPE[material.material_type] || material.material_type}
            {material.duration_minutes ? ` • ${material.duration_minutes} menit` : ""}
            {compact && material.subject_name ? ` • ${material.subject_name}` : ""}
          </p>
          {!compact && material.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>}
          {material.covered_at && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Dibahas di kelas {formatSessionDate(material.covered_at, { day: "numeric", month: "short" })}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => openMaterial(material, user)}
        disabled={!openable}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 disabled:opacity-40"
      >
        <ExternalLink size={13} /> Buka
      </button>
    </div>
  );
}
