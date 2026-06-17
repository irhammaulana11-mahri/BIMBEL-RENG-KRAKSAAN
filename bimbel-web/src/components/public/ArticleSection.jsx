import { useEffect, useState } from "react";
import { getArticles } from "../../services/articleService";

export default function ArticleSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getArticles();
    setArticles(res.data.data);
  };

  return (
    <section id="articles" className="py-20 bg-slate-50">

      <div className="container mx-auto px-6">

        <h2 className="text-4xl font-bold mb-10">
          Artikel Terbaru
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          {articles.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow overflow-hidden"
            >

              <img
                src={`http://127.0.0.1:8001${item.featured_image}`}
                className="w-full h-56 object-cover"
              />

              <div className="p-5">

                <h3 className="font-bold text-xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-gray-500">
                  {item.summary}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}