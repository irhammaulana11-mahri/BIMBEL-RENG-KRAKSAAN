import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  CalendarDays,
  Home,
  Building2,
  Star,
  Video
} from "lucide-react";

import { getPackages } from "@/services/public/websiteService";

export default function PackageSection() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getPackages();
      setPackages(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const getColor = (color) => {
    switch (color) {
      case "green":
        return {
          border: "border-green-500",
          text: "text-green-600",
          button: "bg-green-500 hover:bg-green-600",
        };

      case "red":
        return {
          border: "border-red-500",
          text: "text-red-600",
          button: "bg-red-500 hover:bg-red-600",
        };

      default:
        return {
          border: "border-blue-500",
          text: "text-blue-600",
          button: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  return (
    <section id="packages" className="py-24 bg-slate-50 ">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-5xl font-bold mb-3">Paket Bimbel</h2>
          <p className="text-gray-500 text-lg">
            Pilih paket terbaik sesuai kebutuhan belajar
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {packages.map((item, index) => {
            // Warna kartu mengikuti tipe kelas paket
            const style = getColor({ PRIVATE: "green", ONLINE: "red" }[item.class_type]);
            const isPopular = index === 1;
            return (
              <div key={item.id} className={`relative bg-white rounded-2xl shadow-lg border-t-4 ${style.border}
                  p-8 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl
                  ${isPopular ? "scale-105 ring-2 ring-green-400" : ""}
                `}
              >
                {isPopular && (
                  <div className="absolute top-5 right-5">
                    <span className="bg-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star size={14} />
                      TERLARIS
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{item.package_name}</h3>
                <p className="text-gray-500 mb-6">{item.education_level}</p>
                <div className="mb-5">
                  <span className={`text-3xl font-extrabold ${style.text}`}>
                    Rp {Number(item.default_price || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="text-gray-500 ml-1">/ bulan</span>
                </div>

                <div className="space-y-4 mb-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500"/>
                    <span>Tutor Berpengalaman</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-green-500"/>
                    <span>{item.meeting_per_month}x Pertemuan / Bulan
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-green-500"/>
                    <span>{item.duration_minutes} Menit / Pertemuan</span>
                  </div>

                  {item.class_type === "PRIVATE" && (
                    <div className="flex items-center gap-2">
                      <Home size={18} className="text-green-500"/>
                      <span>Home Visit</span>
                    </div>
                  )}

                  {item.class_type === "REGULER" && (
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-green-500"/>
                      <span>Kelas Gedung</span>
                    </div>
                  )}

                  {item.class_type === "ONLINE" && (
                    <div className="flex items-center gap-2">
                      <Video size={18} className="text-green-500"/>
                      <span>Kelas Online</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500"/>
                    <span>Monitoring Orang Tua</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}