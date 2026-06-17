export default function RecentLeads({data = [],}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-bold text-lg mb-4">Leads Terbaru</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="border-b pb-3">
            <h4 className="font-semibold">{item.full_name}</h4>
            <p className="text-sm text-gray-500">{item.phone}</p>
            <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}