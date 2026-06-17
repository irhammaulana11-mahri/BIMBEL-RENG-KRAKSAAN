import { useEffect,useState, } from "react";
import DashboardStats from "../../components/admin/dashboard/DashboardStats";
import LeadsChart from "../../components/admin/dashboard/LeadsChart";
import LeadStatusChart from "../../components/admin/dashboard/LeadStatusChart";
import RecentLeads from "../../components/admin/dashboard/RecentLeads";
import RecentArticles from "../../components/admin/dashboard/RecentArticles";
import { getDashboard, } from "../../services/dashboardService";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      try {
        const res = await getDashboard();
        setData(res.data || res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  if (loading) {
    return (
      <div>
        Loading Dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        Data dashboard tidak
        ditemukan
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <>
    <div className="space-y-6">
      {/* Header */}
      <div> 
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Ringkasan data website Bimbel Reng Kraksaan</p>
      </div>

      {/* Stats */}
      <DashboardStats data={data}/>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <LeadsChart data={data.lead_chart || []}/>
        <LeadStatusChart data={data.lead_status || {}}/>
      </div>

      {/* Recent */}

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentLeads data={data.recent_leads || []}/>
        <RecentArticles data={data.recent_articles || []}/>
      </div>
    </div>
    </>
    </div>
  );
}