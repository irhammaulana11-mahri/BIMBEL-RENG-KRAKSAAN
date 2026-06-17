// FeatureSection.jsx

import {
  GraduationCap,
  BookOpen,
  Users,
  Clock3
} from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      title: "Tutor Berpengalaman",
      icon: <GraduationCap />
    },
    {
      title: "Metode Efektif",
      icon: <BookOpen />
    },
    {
      title: "Kelas Fleksibel",
      icon: <Users />
    },
    {
      title: "Monitoring Orang Tua",
      icon: <Clock3 />
    }
  ];

  return (
    <section className="container mx-auto py-16">
      <div className="grid md:grid-cols-4 gap-6">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-xl p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              {item.icon}
            </div>

            <h3 className="font-semibold">
              {item.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}