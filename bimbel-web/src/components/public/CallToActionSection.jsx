import {
  ArrowRight,
  Phone
} from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">

        <div
          className="
            relative
            overflow-hidden
            rounded-[40px]
            bg-gradient-to-r
            from-blue-600
            via-blue-700
            to-indigo-700
            p-12
            lg:p-20
            text-white
          "
        >
          <div className="max-w-3xl">

            <span
              className="
                inline-block
                bg-white/20
                px-4
                py-2
                rounded-full
                text-sm
              "
            >
              PENDAFTARAN DIBUKA
            </span>

            <h2
              className="
                text-4xl
                lg:text-6xl
                font-bold
                mt-6
                leading-tight
              "
            >
              Siap Bergabung Bersama
              <br />
              Bimbel Reng Kraksaan?
            </h2>

            <p
              className="
                text-blue-100
                mt-6
                text-lg
                max-w-2xl
              "
            >
              Dapatkan konsultasi gratis,
              pemetaan kemampuan siswa,
              dan rekomendasi program
              belajar terbaik sesuai kebutuhan.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">

              <a
                href="#packages"
                className="
                  inline-flex
                  items-center
                  gap-2
                  bg-white
                  text-blue-700
                  px-8
                  py-4
                  rounded-xl
                  font-semibold
                  hover:scale-105
                  transition
                "
              >
                Daftar Sekarang
                <ArrowRight size={18} />
              </a>

              <a
                href="https://wa.me/628123456789"
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex
                  items-center
                  gap-2
                  border
                  border-white
                  px-8
                  py-4
                  rounded-xl
                  font-semibold
                  hover:bg-white/10
                  transition
                "
              >
                <Phone size={18} />
                WhatsApp
              </a>

            </div>

          </div>

          {/* Background Decoration */}

          <div
            className="
              absolute
              right-[-100px]
              top-[-100px]
              w-[350px]
              h-[350px]
              bg-white/10
              rounded-full
            "
          />

          <div
            className="
              absolute
              right-[120px]
              bottom-[-120px]
              w-[250px]
              h-[250px]
              bg-white/10
              rounded-full
            "
          />

        </div>

      </div>
    </section>
  );
}