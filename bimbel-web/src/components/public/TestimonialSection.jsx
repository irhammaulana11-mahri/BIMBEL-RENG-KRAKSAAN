import { useEffect, useState } from "react";
import { getTestimonials } from "../../services/testimonialService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination,Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Quote,Star } from "lucide-react";

export default function TestimonialSection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getTestimonials();
      setItems(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const renderStars = (rating = 5) => {
    return [...Array(rating)].map((_, index) => (
      <Star key={index} size={18} className="fill-yellow-400 text-yellow-400"/>
    ));
  };

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold">TESTIMONI SISWA</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-2">Apa Kata Mereka?</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Pengalaman siswa yang telah belajar
            bersama Bimbel Reng Kraksaan.
          </p>
        </div>

        <Swiper modules={[Pagination,Autoplay]}
          pagination={{clickable: true}}
          autoplay={{delay: 5000}}
          spaceBetween={30}
          breakpoints={{
            0: {slidesPerView: 1},
            768: {slidesPerView: 2},
            1200: {slidesPerView: 3}
          }}
        >

          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300
                p-8 h-full flex flex-col"
              >
                <Quote size={40} className="text-blue-600 mb-4"/>
                <div className="flex mb-4">{renderStars(item.rating)}</div>
                <p className="text-gray-600 italic leading-relaxed flex-1">"{item.testimonial}"</p>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t">
                  <img src={item.photo_url ? `http://127.0.0.1:8001${item.photo_url}` : "/default-avatar.png"}
                    alt={item.student_name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h4 className="font-bold text-lg">{item.student_name}</h4>
                    <p className="text-gray-500 text-sm">{item.school_name}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}