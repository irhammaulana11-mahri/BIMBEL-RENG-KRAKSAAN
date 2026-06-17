import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import { getTestimonials } from "../../services/testimonialService";

export default function TestimonialSection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getTestimonials();
    setItems(res.data.data);
  };

  return (
    <section
      id="testimonials"
      className="py-20 bg-blue-600 text-white"
    >

      <div className="container mx-auto px-6">

        <h2 className="text-center text-4xl font-bold mb-10">
          Testimoni Siswa
        </h2>

        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000 }}
          loop
        >

          {items.map((item) => (
            <SwiperSlide key={item.id}>

              <div className="max-w-3xl mx-auto text-center">

                <p className="text-xl mb-6">
                  "{item.testimonial}"
                </p>

                <h3 className="font-bold text-2xl">
                  {item.student_name}
                </h3>

                <p>
                  {item.school_name}
                </p>

              </div>

            </SwiperSlide>
          ))}

        </Swiper>

      </div>

    </section>
  );
}