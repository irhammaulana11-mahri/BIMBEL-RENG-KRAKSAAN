// HeroSection.jsx

import { useEffect, useState } from "react";
import { getBanners } from "../../services/bannerService";

export default function HeroSection() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadBanner();
  }, []);

  const loadBanner = async () => {
    try {
      const res = await getBanners();
      setBanners(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section id="hero" className="bg-slate-50 py-20">
    <div className="container mx-auto px-6">

        <div className="grid md:grid-cols-2 gap-10 items-center">

        <div>

            <h1 className="text-6xl font-bold mb-6">
            Belajar Lebih Mudah,
            <br />
            Prestasi Lebih Terarah
            </h1>

            <p className="text-gray-600 mb-8">
            Bimbingan belajar terbaik untuk SD,
            SMP dan SMA dengan tutor
            berpengalaman.
            </p>

            <div className="flex gap-4">

            <a
                href="#packages"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg"
            >
                Daftar Sekarang
            </a>

            <a
                href="#packages"
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg"
            >
                Lihat Paket
            </a>

            </div>

        </div>

        <div>

            <img
            src="https://images.unsplash.com/photo-1509062522246-3755977927d7"
            className="rounded-xl shadow-xl"
            />

        </div>

        </div>

    </div>
    </section>
    );
}