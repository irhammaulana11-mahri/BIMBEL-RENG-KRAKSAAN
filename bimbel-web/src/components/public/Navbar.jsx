import { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { getCompanyProfile } from "@/services/public/websiteService";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [company, setCompany] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const res = await getCompanyProfile();
    setCompany(res.data.data);

  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            {company?.logo_url && (<img src={assetUrl(company.logo_url)} alt="Logo" className="h-12 w-auto"/>)}
            <div>
              <h1 className="hidden md:block font-bold text-xl whitespace-nowrap">{company?.company_name}</h1>
              <h1 className="md:hidden font-bold text-lg">Bimbel</h1>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8 mr-8 ml-auto">
            <a href="\">Beranda</a>
            <a href="#packages">Paket</a>
            <a href="#activities">Kegiatan</a>
            <a href="#articles">Artikel</a>
            <a href="#testimonials">Testimoni</a>
            <a href="#about">Tentang Kami</a>
          </div>

          {/* <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Login
          </button> */}
          {/* <div className="flex items-center gap-3"> */}
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="
              bg-blue-600
              text-white
              px-5
              py-2
              rounded-lg 
              "
            >
              Login
            </Link>

            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X size={28} />
              ) : (
                <Menu size={28} />
              )}
            </button>

          </div>          
          </div>
          {mobileOpen && (
            <div className="lg:hidden bg-white border-t shadow-lg">
              <div className="flex flex-col p-5 gap-4">
                <a href="\" onClick={() => setMobileOpen(false)} >Beranda</a>
                <a href="#packages" onClick={() => setMobileOpen(false)}>Paket</a>
                <a href="#activities" onClick={() => setMobileOpen(false)} >Kegiatan</a>
                <a href="#articles" onClick={() => setMobileOpen(false)}>Artikel</a>
                <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimoni</a>
                <a href="/about" onClick={() => setMobileOpen(false)}>Tentang Kami</a>
              </div>
            </div>
          )}
        </div>
      {/* </div> */}
    </nav>
  );
}