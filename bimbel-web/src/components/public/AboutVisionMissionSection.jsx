import { Eye,Target } from "lucide-react";

export default function AboutVisionMissionSection() {

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <Eye className="text-blue-600 mb-4" size={40}/>
          <h3 className="text-2xl font-bold mb-4">Visi</h3>
          <p className="text-gray-600">
            Menjadi lembaga bimbingan
            belajar terbaik dan terpercaya
            di Kabupaten Probolinggo.
          </p>

        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <Target className="text-blue-600 mb-4" size={40}/>
          <h3 className="text-2xl font-bold mb-4">Misi</h3>
          <ul className="space-y-3 text-gray-600">
            <li>✓ Menyediakan tutor terbaik</li>
            <li>✓ Metode pembelajaran efektif</li>
            <li>✓ Monitoring perkembangan siswa</li>
            <li>✓ Membantu mencapai prestasi</li>
          </ul>
        </div>
      </div>
    </section>
  );
}