import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaYoutube
} from "react-icons/fa";

import { getCompanyProfile } from "../services/companyProfileService";

export default function Footer() {

  const [company, setCompany] =
    useState(null);

  useEffect(() => {
    loadCompany();
  }, []);

   const loadCompany = async () => {
    const res = await getCompanyProfile();
    setCompany(res.data.data);
  };

  return (
    <footer id="footer"className="bg-slate-950 text-white">

      {/* Top Footer */}

      <div className="container mx-auto px-6 py-20">

        <div className="grid lg:grid-cols-4 gap-12">

          {/* Company */}

          <div>

            {company?.logo_url && (
              <img
                src={`http://127.0.0.1:8001${company.logo_url}`}
                alt="logo"
                className="h-20 mb-4"
              />
            )}

            <h3 className="text-2xl font-bold mb-3">
              {company?.company_name}
            </h3>

            <p className="text-gray-400 leading-relaxed">
              Lembaga bimbingan belajar
              terpercaya yang membantu
              siswa mencapai prestasi
              akademik terbaik.
            </p>

          </div>

          {/* Menu */}

          <div>

            <h4 className="font-bold text-lg mb-5">
              Menu Cepat
            </h4>

            <ul className="space-y-3 text-gray-400">

              <li>
                <a href="#hero">
                  Beranda
                </a>
              </li>

              <li>
                <a href="#packages">
                  Paket
                </a>
              </li>

              <li>
                <a href="#activities">
                  Kegiatan
                </a>
              </li>

              <li>
                <a href="#articles">
                  Artikel
                </a>
              </li>

              <li>
                <a href="#faq">
                  FAQ
                </a>
              </li>

            </ul>

          </div>

          {/* Informasi */}

          <div>

            <h4 className="font-bold text-lg mb-5">
              Informasi
            </h4>

            <ul className="space-y-3 text-gray-400">

              <li>
                Tutor Profesional
              </li>

              <li>
                Home Visit
              </li>

              <li>
                Kelas Gedung
              </li>

              <li>
                Try Out Berkala
              </li>

              <li>
                Monitoring Orang Tua
              </li>

            </ul>

          </div>

          {/* Kontak */}

          <div>

            <h4 className="font-bold text-lg mb-5">
              Kontak Kami
            </h4>

            <div className="space-y-4 text-gray-400">

              <div className="flex gap-3">

                <MapPin
                  size={18}
                  className="mt-1"
                />

                <span>
                  {company?.address}
                </span>

              </div>

              <div className="flex gap-3">

                <Phone
                  size={18}
                  className="mt-1"
                />

                <span>
                  {company?.phone}
                </span>

              </div>

              <div className="flex gap-3">

                <Mail
                  size={18}
                  className="mt-1"
                />

                <span>
                  {company?.email}
                </span>

              </div>

              <div className="flex gap-3">

                <Globe
                  size={18}
                  className="mt-1"
                />

                <span>
                  {company?.website_url}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Bottom Footer */}

      <div className="border-t border-slate-800">

        <div
          className="
          container
          mx-auto
          px-6
          py-6
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-4
        "
        >

          <p className="text-gray-400">
            © {new Date().getFullYear()}
            {" "}
            {company?.company_name}.
            All Rights Reserved.
          </p>

          <div className="flex gap-5">

  {company?.facebook_url && (
    <a
      href={company.facebook_url}
      target="_blank"
      rel="noreferrer"
      className="
      w-10 h-10
      rounded-full
      bg-slate-800
      flex items-center justify-center
      hover:bg-blue-600
      transition
      "
    >
      <FaFacebookF />
    </a>
  )}

  {company?.instagram_url && (
    <a
      href={company.instagram_url}
      target="_blank"
      rel="noreferrer"
      className="
      w-10 h-10
      rounded-full
      bg-slate-800
      flex items-center justify-center
      hover:bg-pink-600
      transition
      "
    >
      <FaInstagram />
    </a>
  )}

  {company?.youtube_url && (
    <a
      href={company.youtube_url}
      target="_blank"
      rel="noreferrer"
      className="
      w-10 h-10
      rounded-full
      bg-slate-800
      flex items-center justify-center
      hover:bg-red-600
      transition
      "
    >
      <FaYoutube />
    </a>
  )}

</div>

        </div>

      </div>

    </footer>
  );
}