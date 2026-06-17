import { useEffect, useState } from "react";
import { getPackages } from "../../services/packageService";

export default function PackageSection() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getPackages();
    setPackages(res.data.data);
  };

  const getColor = (color) => {
    switch (color) {
      case "red":
        return "border-red-500";
      case "green":
        return "border-green-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    <section id="packages" className="py-20 bg-slate-50">

      <div className="container mx-auto px-6">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Paket Bimbel
          </h2>

          <p className="text-gray-500 mt-3">
            Pilih paket sesuai kebutuhan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          {packages.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow p-8 border-t-8 ${getColor(item.card_color)}`}
            >
              <h3 className="text-2xl font-bold">
                {item.package_name}
              </h3>

              <p className="text-4xl font-bold mt-4 text-blue-600">
                Rp {Number(item.price).toLocaleString("id-ID")}
              </p>

              <ul className="mt-6 space-y-2">

                <li>✓ Tutor Berpengalaman</li>
                <li>✓ Modul Belajar</li>
                <li>✓ Monitoring Orang Tua</li>

              </ul>

              <button
                className="w-full mt-8 bg-blue-600 text-white py-3 rounded-lg"
              >
                Lihat Detail
              </button>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}