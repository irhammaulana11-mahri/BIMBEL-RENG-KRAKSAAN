import { useEffect, useState } from "react";
import { getCompanyProfile } from "../../services/companyProfileService";

export default function AboutHeroSection() {
  const [company,setCompany] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getCompanyProfile();
    setCompany(res.data.data);
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full">TENTANG KAMI</span>
            <h1 className="text-5xl lg:text-6xl font-bold mt-6 ">{company?.company_name}</h1>
            <p className="text-gray-600 text-lg mt-6 leading-relaxed">
              Bimbingan belajar terpercaya
              yang membantu siswa mencapai
              prestasi akademik terbaik.
            </p>
          </div>
          <div>
            {company?.logo_url && (
              <img src={`http://127.0.0.1:8001${company.logo_url}`} alt="logo" className="w-full max-w-md mx-auto"/>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}