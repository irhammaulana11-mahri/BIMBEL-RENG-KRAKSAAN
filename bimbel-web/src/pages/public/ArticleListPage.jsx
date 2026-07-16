import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles } from "../../services/articleService";

export default function ArticleListPage() {

  const [articles,setArticles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getArticles();
    setArticles(res.data.data);
  };

  return (
    <section className="py-20">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-12">

          <p className="text-blue-600 font-semibold">
            BLOG & EDUKASI
          </p>

          <h1 className="text-5xl font-bold mt-3">
            Semua Artikel
          </h1>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

          {articles.map((item) => (

            <Link
              key={item.id}
              to={`/articles/${item.slug}`}
              className="
              bg-white
              rounded-3xl
              overflow-hidden
              shadow-sm
              hover:shadow-xl
              transition
              group
              "
            >

              <img
                src={`http://127.0.0.1:8001${item.featured_image}`}
                className="
                w-full
                h-60
                object-cover
                group-hover:scale-105
                transition
                duration-300
                "
              />

              <div className="p-6">

                <h3 className="
                font-bold
                text-xl
                line-clamp-2
                ">
                  {item.title}
                </h3>

                <p className="
                text-gray-600
                mt-3
                line-clamp-3
                ">
                  {item.summary}
                </p>

                <div className="
                flex
                justify-between
                mt-5
                text-sm
                text-gray-500
                ">
                  <span>
                    👁 {item.view_count}
                  </span>

                  <span>
                    →
                  </span>
                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </section>
  );
}