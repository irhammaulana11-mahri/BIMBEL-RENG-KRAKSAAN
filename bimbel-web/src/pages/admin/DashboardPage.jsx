import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function DashboardPage() {

  const [stats,setStats] = useState({});

  useEffect(()=>{
    loadData();
  },[]);

  const loadData = async()=>{
    const res = await api.get("/admin/dashboard");
    setStats(res.data);
  };

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-5 gap-5">

        <div className="bg-blue-500 text-white p-6 rounded-xl">
          <p>Siswa</p>
          <h2 className="text-3xl">
            {stats.students}
          </h2>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-xl">
          <p>Tentor</p>
          <h2 className="text-3xl">
            {stats.tutors}
          </h2>
        </div>

        <div className="bg-purple-500 text-white p-6 rounded-xl">
          <p>Kelas</p>
          <h2 className="text-3xl">
            {stats.classes}
          </h2>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-xl">
          <p>Artikel</p>
          <h2 className="text-3xl">
            {stats.articles}
          </h2>
        </div>

        <div className="bg-red-500 text-white p-6 rounded-xl">
          <p>Leads</p>
          <h2 className="text-3xl">
            {stats.leads}
          </h2>
        </div>

      </div>

    </div>
  );
}