import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import {
  getActivityById
} from "../../services/activityService";

export default function ActivityDetailPage() {

  const { id } = useParams();

  const [activity,setActivity] =
    useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {

    const res =
      await getActivityById(id);

    setActivity(res.data.data);
  };

  if (!activity) {
    return (
      <div className="py-20 text-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="py-20">

      <div className="max-w-5xl mx-auto px-6">

        <img
          src={`http://127.0.0.1:8001${activity.cover_image}`}
          className="
          w-full
          h-[500px]
          object-cover
          rounded-3xl
          "
        />

        <div className="mt-10">

          <h1 className="
          text-5xl
          font-bold
          ">
            {activity.title}
          </h1>

          <div className="
          flex
          gap-6
          mt-4
          text-gray-500
          ">
            <span>
              📅 {activity.activity_date}
            </span>

            <span>
              📍 {activity.location}
            </span>
          </div>

          <div className="
          mt-8
          prose
          max-w-none
          ">
            {activity.description}
          </div>

        </div>

      </div>

    </section>
  );
}