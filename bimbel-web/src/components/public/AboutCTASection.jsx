import { Link } from "react-router-dom";

export default function AboutCTASection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center px-6">
        <h2 className="text-5xl font-bold ">Siap Bergabung?</h2>
        <p className="text-gray-600 mt-5">
          Mulai perjalanan belajar
          terbaik bersama kami.
        </p>

        <Link to="/register" className=" inline-block mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl">
          Daftar Sekarang
        </Link>

      </div>

    </section>
  );
}