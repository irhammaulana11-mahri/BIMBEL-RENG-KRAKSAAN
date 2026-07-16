import { GraduationCap,Users,Home,ShieldCheck } from "lucide-react";

export default function AboutFeatureSection() {
  const items = [
    {icon: GraduationCap,title: "Tutor Profesional"},
    {icon: Users,title: "Kelas Fleksibel"},
    {icon: Home,title: "Home Visit"},
    {icon: ShieldCheck,title: "Monitoring Orang Tua"}
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {items.map((item,index) => {
            const Icon = item.icon;

            return (
              <div key={index} className="text-center p-8 rounded-3xl bg-slate-50">
                <Icon className="mx-auto text-blue-600 mb-4" size={40}/>
                <h3 className="font-semibold">{item.title}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}