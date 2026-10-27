import { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { Link } from "react-router-dom";
import { getActivities } from "@/services/public/websiteService";

export default function ActivityListPage() {
  const [activities,setActivities] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getActivities();
    setActivities(res.data.data || []);
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold">KEGIATAN BIMBEL8</p>
          <h1 className="text-5xl font-bold mt-3">Semua Kegiatan</h1>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

          {activities.map((item) => (

            <Link
              key={item.id}
              to={`/activities/${item.id}`}
              className="
              bg-white
              rounded-3xl
              overflow-hidden
              shadow-sm
              hover:shadow-xl
              transition
              group
              "
            >

              <img
                src={assetUrl(item.cover_image)}
                className="
                w-full
                h-60
                object-cover
                group-hover:scale-105
                transition
                duration-300
                "
              />

              <div className="p-6">

                <h3 className="
                font-bold
                text-xl
                ">
                  {item.title}
                </h3>

                <p className="
                text-gray-600
                mt-3
                line-clamp-3
                ">
                  {item.description}
                </p>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </section>
  );
}