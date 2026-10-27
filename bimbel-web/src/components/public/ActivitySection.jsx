import { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { CalendarDays, ArrowRight } from "lucide-react";
import { getActivities } from "@/services/public/websiteService";
import { Link } from "react-router-dom";

export default function ActivitySection() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getActivities();
      setActivities(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section id="activities" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold">KEGIATAN BIMBEL</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-2">Kegiatan Terbaru</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Dokumentasi kegiatan belajar,
            try out, seminar dan berbagai
            aktivitas siswa Bimbel Reng Kraksaan.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {activities.slice(0, 3).map((item) => (
            <Link key={item.id} to={`/activities/${item.id}`} className="group bg-white rounded-3xl overflow-hidden
                shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative overflow-hidden">
                <img src={assetUrl(item.cover_image)} alt={item.title} className="w-full
                    h-64 object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <CalendarDays size={16} />{item.activity_date || "Kegiatan Bimbel"}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600 line-clamp-3">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/activities" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white px-8 py-4 rounded-xl transition"
          >
            Lihat Semua Kegiatan
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}