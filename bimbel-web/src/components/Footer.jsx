import { useEffect, useState } from "react";
import { getCompanyProfile } from "../services/companyProfileService";

export default function Footer() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const res = await getCompanyProfile();
    setCompany(res.data.data);
  };

  return (
    <footer className="bg-blue-700 text-white mt-20">
      <div className="container mx-auto px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <img
              src={`http://127.0.0.1:8001${company?.logo_url}`}
              className="h-40"
            />

            <h3 className="text-2xl font-bold">
              {company?.company_name}
            </h3>

          </div>

          <div>

            <h4 className="font-bold mb-4">
              Menu
            </h4>

            <ul className="space-y-2">
              <li>Beranda</li>
              <li>Paket</li>
              <li>Kegiatan</li>
              <li>Artikel</li>
            </ul>

          </div>

          <div>

            <h4 className="font-bold mb-4">
              Informasi
            </h4>

            <ul className="space-y-2">
              <li>Tentang Kami</li>
              <li>Program</li>
              <li>FAQ</li>
            </ul>

          </div>

          <div>

            <h4 className="font-bold mb-4">
              Kontak
            </h4>

            <p>{company?.address}</p>
            <p>{company?.phone}</p>
            <p>{company?.email}</p>

          </div>

        </div>

        <hr className="my-10 border-blue-500" />

        <div className="flex justify-between">

          <span>
            © 2026 {company?.company_name}
          </span>

          <div className="flex gap-4">

            <a href={company?.facebook_url}>
              Facebook
            </a>

            <a href={company?.instagram_url}>
              Instagram
            </a>

            <a href={company?.youtube_url}>
              Youtube
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
}