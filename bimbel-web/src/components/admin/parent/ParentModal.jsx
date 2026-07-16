import { X } from "lucide-react";
import ParentForm from "./ParentForm";

export default function ParentModal({open,onClose,data,onSubmit,loading,}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">

          <div>
            <h2 className="text-2xl font-bold">Edit Orang Tua</h2>
            <p className="text-gray-500">Update data orang tua</p>
          </div>

          <button onClick={onClose}><X /></button>
        </div>

        <ParentForm initialData={data} onSubmit={onSubmit} loading={loading}/>
      </div>
    </div>
  );
}