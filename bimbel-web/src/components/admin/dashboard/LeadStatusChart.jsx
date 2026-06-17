import { PieChart,Pie,Cell,Tooltip,Legend,ResponsiveContainer, } from "recharts";

const COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

export default function LeadStatusChart({data,}) {
  const chartData = [
    {
      name: "NEW",
      value: data.new || 0,
    },
    {
      name: "CONTACTED",
      value: data.contacted || 0,
    },
    {
      name: "FOLLOW UP",
      value: data.follow_up || 0,
    },
    {
      name: "REGISTERED",
      value: data.registered || 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-bold text-lg mb-4">Status Leads</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} dataKey="value" outerRadius={100} label>
            {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index %COLORS.length]}/>
              )
            )}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}