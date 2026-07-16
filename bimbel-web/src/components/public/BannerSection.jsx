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
      {/* <div className="container mx-auto px-6"> */}
      <div className="relative">        
        <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 4000 }}pagination={{ clickable: true }}loop>
          {banners.map((item) => (
            <SwiperSlide key={item.id}>
              <img
                src={`http://127.0.0.1:8001${item.image_url}`}
                alt={item.title}
                className="w-full h-[500px] object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/50"/>
                <div className="absolute inset-0 flex items-center">
                  <div className="ml-16 text-white">
                    <h2 className="text-5xl font-bold">{item.title}</h2>
                    <p className="mt-4 text-xl">{item.subtitle}</p>
                    <a href={item.button_link} className="inline-block mt-6 bg-blue-600 px-8 py-3 rounded-xl">
                      {item.button_text}
                    </a>
                  </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}