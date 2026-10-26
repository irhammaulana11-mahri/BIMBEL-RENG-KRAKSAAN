import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { getBanners } from "../../services/bannerService";

export default function HeroBannerSection() {const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getBanners();
      setBanners(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 pt-6 pb-30">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch min-h-[420px]">
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-center pr-5">
            <span className="inline-block bg-blue-100 text-blue-700 px-5 py-2 rounded-full text-sm font-medium mb-3">
              Bimbel Terpercaya di Kraksaan
            </span>

            <h1 className="text-5xl font-extrabold leading-tight mb-3">
              Bimbel Terbaik di Kraksaan
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-3">
              Hanya satu-satunya di Kabupaten Probolinggo
              dengan tutor berpengalaman dan metode belajar
              yang terbukti meningkatkan prestasi siswa.
            </p>

            <div className="space-y-4 text-md mb-4">
              <div>✓ Tutor Berpengalaman</div>
              <div>✓ Home Visit & Kelas Gedung</div>
              <div>✓ Monitoring Orang Tua</div>
              <div>✓ Try Out Berkala</div>
            </div>
            <div className="flex gap-4 mb-4">
              <a href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition"
              >
                Daftar Sekarang
              </a>

              <a href="#packages"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition"
              >
                Lihat Paket
              </a>
            </div>

            {/* STATS */}

            {/* <div className="grid grid-cols-3 border-t pt-8">
              <div>
                <h3 className="text-3xl font-bold text-blue-600">500+</h3>
                <p className="text-gray-600 mt-2">Siswa</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-blue-600">30+</h3>
                <p className="text-gray-600 mt-2">Tutor</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-blue-600">95%</h3>
                <p className="text-gray-600 mt-2">Kelulusan</p>
              </div>
            </div> */}
          </div>

          {/* RIGHT IMAGE SWIPER */}
          <div className="relative h-full overflow-hidden">
            <Swiper modules={[Pagination, Autoplay]} autoplay={{delay: 5000,disableOnInteraction: false,}}
              pagination={{clickable: true,}} loop className="h-full"
            >
              {banners.map((banner) => (
                <SwiperSlide key={banner.id}>
                  <div className="relative h-[550px]">

                    <img
                      src={`http://127.0.0.1:8001${banner.image_url}`}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient ke arah text */}
                    <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent"/>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
