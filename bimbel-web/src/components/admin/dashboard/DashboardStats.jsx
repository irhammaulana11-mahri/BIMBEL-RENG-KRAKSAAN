import { Users,BookOpen,Package,UserPlus,} from "lucide-react";

export default function DashboardStats({data,}) {
  const cards = [
    {
      title: "Total Leads",
      value: data.total_leads,
      icon: Users,
    },
    {
      title: "Leads Baru",
      value: data.new_leads,
      icon: UserPlus,
    },
    {
      title: "Artikel",
      value: data.articles,
      icon: BookOpen,
    },
    {
      title: "Paket Aktif",
      value:
        data.active_packages,
      icon: Package,
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {cards.map(
        (
          {
            title,
            value,
            icon: Icon,
          },
          idx
        ) => (
          <div key={idx} className="bg-white rounded-2xl shadow p-5">
            <div className="flex justify-between items-center ">
              <div>
                <p className="text-gray-500">{title}</p>
                <h2 className="text-3xl font-bold mt-2 ">{value}</h2>
              </div>

              <Icon size={40} className="text-blue-600"/>
            </div>
          </div>
        )
      )}
    </div>
  );
}