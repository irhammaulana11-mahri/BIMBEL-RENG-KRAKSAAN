import { FileText, Video, Link, Presentation, Image, HelpCircle } from "lucide-react";

export const MATERIAL_TYPES = {
  DOCUMENT: {
    key: "DOCUMENT",
    label: "Dokumen PDF / Berkas",
    desc: "Modul, E-Book, atau Worksheet",
    icon: FileText,
    badgeBg: "bg-red-50 text-red-600 border-red-200",
    badgeLabel: "PDF / DOC",
  },
  VIDEO: {
    key: "VIDEO",
    label: "Video Pembelajaran",
    desc: "YouTube, Vimeo, atau MP4",
    icon: Video,
    badgeBg: "bg-purple-50 text-purple-600 border-purple-200",
    badgeLabel: "VIDEO",
  },
  LINK: {
    key: "LINK",
    label: "Tautan / Website External",
    desc: "Artikel, Blog, atau LMS luar",
    icon: Link,
    badgeBg: "bg-blue-50 text-blue-600 border-blue-200",
    badgeLabel: "LINK",
  },
  PRESENTATION: {
    key: "PRESENTATION",
    label: "Slide Presentasi",
    desc: "PowerPoint / Google Slides",
    icon: Presentation,
    badgeBg: "bg-orange-50 text-orange-600 border-orange-200",
    badgeLabel: "PPT",
  },
  IMAGE: {
    key: "IMAGE",
    label: "Gambar / Infografis",
    desc: "Diagram, Peta Konsep, Poster",
    icon: Image,
    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badgeLabel: "IMAGE",
  },
};