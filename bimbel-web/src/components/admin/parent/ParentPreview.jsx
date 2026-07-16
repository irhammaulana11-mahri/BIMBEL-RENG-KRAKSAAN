import { X,Mail,Phone,Briefcase,Users,MapPin, } from "lucide-react";

export default function ParentPreview({parent,onClose,}) {
  if (!parent) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/20 z-40"/>
      <div className="fixed top-0 right-0 h-full w-[460px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{parent.full_name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">Aktif</span>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                  {parent.students_count} Anak
                </span>
              </div>
            </div>

            <button onClick={onClose}><X size={22} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <Info icon={<Mail size={18} />} label="Email" value={parent.user?.email || "-"}/>
          <Info icon={<Phone size={18} />} label="Telepon" value={parent.user?.phone || "-"}/>
          <Info icon={<Briefcase size={18} />} label="Pekerjaan" value={parent.occupation || "-"}/>
          <Info icon={<Users size={18} />} label="Hubungan" value={parent.relationship || "-"}/>
          <Info icon={<MapPin size={18} />} label="Alamat" value={parent.address || "-"}/>

          <div>
            <h3 className="font-semibold mb-3">Anak Terdaftar</h3>
            <div className="space-y-2">
              {parent.students?.length > 0 ? (
                parent.students.map((student) => (
                  <div key={student.id} className="border rounded-xl p-3">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.nis}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  Belum ada siswa
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({icon,label,value,}) {
  return (
    <div className="flex gap-3">
      <div className="text-blue-600">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500">
          {label}
        </div>
        <div className="font-medium">
          {value}
        </div>
      </div>
    </div>
  );
}