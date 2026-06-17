import { ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,} from "recharts";

export default function LeadsChart({data = [],}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-bold text-lg mb-4">Leads Bulanan</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}