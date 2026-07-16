import { useEffect, useState } from "react";
import { CalendarDays,Eye,ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getArticles } from "../../services/articleService";

export default function ArticleSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getArticles();
      setArticles(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <section id="articles" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold">BLOG & EDUKASI</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-2">Artikel Terbaru</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Tips belajar, informasi pendidikan,
            dan berbagai artikel bermanfaat
            untuk siswa dan orang tua.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {articles.slice(0, 3).map((item) => (
            <Link key={item.id}  to={`/articles/${item.slug}`} className="group bg-white rounded-3xl overflow-hidden
                shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="overflow-hidden">
                <img src={`http://127.0.0.1:8001${item.featured_image}`} alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.categories?.slice(0, 2).map((cat) => (
                    <span key={cat.id} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                      {cat.category_name}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{item.title}</h3>
                <p className="text-gray-600 line-clamp-3 mb-5">{item.summary}</p>
                <div className="flex justify-between text-sm text-gray-500 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />{item.publish_date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} />{item.view_count || 0}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/articles" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white px-8 py-4 rounded-xl transition"
          >
            Baca Semua Artikel
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}