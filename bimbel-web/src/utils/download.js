import api from "@/api/axios";

// Unduh berkas dari API ber-token (mis. PDF slip/invoice) lalu simpan dengan nama dari server
export async function downloadFile(url, fallbackName = "dokumen.pdf", params = {}) {
  const res = await api.get(url, { params, responseType: "blob" });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;

  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
