import { useEffect, useState } from "react";
import { getCompanyProfile } from "../services/companyProfileService";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const res = await getCompanyProfile();
    setCompany(res.data.data);
    console.log(res.data.data.logo_url)
console.log(`http://127.0.0.1:8001${res.data.data.logo_url}`);


  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {company?.logo_url && (
              <img src={`http://127.0.0.1:8001${company.logo_url}`}className="h-14"/>
            )}
            <span className="font-bold text-xl">
              {company?.company_name}
            </span>
          </div>
          <div className="hidden md:flex gap-10">
            <a href="#hero">Beranda</a>
            <a href="#packages">Paket</a>
            <a href="#activities">Kegiatan</a>
            <a href="#articles">Artikel</a>
            <a href="#testimonials">Testimoni</a>
            <a href="#about">Tentang Kami</a>
          </div>

          {/* <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Login
          </button> */}
          <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Login</Link>
        </div>
      </div>
    </nav>
  );
}