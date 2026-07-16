export default function AboutStatisticSection() {

  return (
    <section className="py-24 bg-blue-600 text-white">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <div>
          <h3 className="text-5xl font-bold">500+</h3>
          <p>Siswa</p>
        </div>

        <div>
          <h3 className="text-5xl font-bold">30+</h3>
          <p>Tutor</p>
        </div>

        <div>
          <h3 className="text-5xl font-bold">95%</h3>
          <p>Kelulusan</p>
        </div>

        <div>
          <h3 className="text-5xl font-bold">10+</h3>
          <p>Tahun Pengalaman</p>
        </div>
      </div>
    </section>
  );
}