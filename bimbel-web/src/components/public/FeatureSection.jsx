import {
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
} from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      title: "Tutor Berpengalaman",
      description:
        "Pengajar profesional dan berpengalaman membimbing siswa mencapai prestasi terbaik.",
      icon: GraduationCap,
    },
    {
      title: "Metode Efektif",
      description:
        "Metode belajar modern yang mudah dipahami dan sesuai kebutuhan siswa.",
      icon: BookOpen,
    },
    {
      title: "Kelas Fleksibel",
      description:
        "Pilihan Home Visit maupun kelas gedung dengan jadwal yang fleksibel.",
      icon: Users,
    },
    {
      title: "Monitoring Orang Tua",
      description:
        "Perkembangan belajar siswa dipantau dan dilaporkan secara berkala.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="relative z-20 -mt-16 mb-20">
      <div className="container mx-auto px-6">
        <div className="bg-white shadow-xl border border-slate-100 p-8">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            {features.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  className="flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon
                      size={28}
                      className="text-blue-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      </div>
    </section>
  );
}