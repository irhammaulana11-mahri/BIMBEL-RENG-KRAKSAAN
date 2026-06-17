import { useEffect, useState } from "react";
import { getActivities } from "../../services/activityService";

export default function ActivitySection() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getActivities();
    setActivities(res.data.data);
  };

  return (
    <section id="activities" className="py-20">

      <div className="container mx-auto px-6">

        <div className="flex justify-between mb-8">

          <h2 className="text-4xl font-bold">
            Kegiatan Terbaru
          </h2>

        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {activities.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow overflow-hidden"
            >

              <img
                src={`http://127.0.0.1:8001${item.cover_image}`}
                className="w-full h-56 object-cover"
              />

              <div className="p-5">

                <h3 className="font-bold text-xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-gray-600">
                  {item.description}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}