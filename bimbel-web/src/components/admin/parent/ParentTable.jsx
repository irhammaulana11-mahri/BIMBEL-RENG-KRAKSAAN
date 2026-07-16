
import { Eye,Pencil,Trash2 } from "lucide-react";

export default function ParentTable({data=[],onPreview,onEdit,onDelete,}) {

  return (
      <div className="max-w-full overflow-x-auto">
        
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-4 text-left">Nama</th>
              <th className="px-6 py-4 text-left">Telepon</th>
              <th className="px-6 py-4 text-left">Pekerjaan</th>
              <th className="px-6 py-4 text-center">Anak</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
            <tr>
                <td colSpan="6" className=" py-10 text-center text-gray-500">Belum ada data orang tua</td>
            </tr>

            ) : (
            data.map((parent) => (
              <tr key={parent.id} className="border-b">
                <td className="px-6 py-4">{parent.full_name}</td>
                <td className="px-6 py-4">{parent.user?.phone || "-"}</td>
                <td className="px-6 py-4">{parent.occupation}</td>
                <td className="px-6 py-4 text-center">{parent.students_count}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      parent.user?.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {parent.user?.is_active
                      ? "Aktif"
                      : "Nonaktif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => onPreview(parent)}className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <Eye size={16}/>
                    </button>
                    <button onClick={() => onEdit(parent)} className="rounded-lg bg-yellow-100 p-2 text-yellow-600">
                      <Pencil size={16}/>
                    </button>
                    <button onClick={() => onDelete(parent.id)} className="rounded-lg bg-red-100 p-2 text-red-600">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
  );
}