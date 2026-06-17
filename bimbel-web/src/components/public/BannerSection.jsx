import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import { getBanners } from "../../services/bannerService";

export default function BannerSection() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getBanners();
      setBanners(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-6">

        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
          loop
        >
          {banners.map((item) => (
            <SwiperSlide key={item.id}>
              <img
                src={`http://127.0.0.1:8001${item.image_url}`}
                alt={item.title}
                className="w-full h-[500px] object-cover rounded-2xl"
              />
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </section>
  );
}