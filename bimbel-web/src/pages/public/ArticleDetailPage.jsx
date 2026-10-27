import { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { useParams } from "react-router-dom";
import { getArticleBySlug } from "@/services/public/websiteService";

export default function ArticleDetailPage() {

  const { slug } = useParams();

  const [article,setArticle] = useState(null);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    const res = await getArticleBySlug(slug);
    setArticle(res.data.data);
  };

  if (!article) {
    return (
      <div className="py-20 text-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="py-20">

      <div className="max-w-4xl mx-auto px-6">

        <img
          src={assetUrl(article.featured_image)}
          className="
          w-full
          h-[500px]
          object-cover
          rounded-3xl
          "
        />

        <div className="mt-10">

          <div className="
          flex
          gap-3
          mb-4
          flex-wrap
          ">
            {article.categories?.map((cat) => (
              <span
                key={cat.id}
                className="
                px-3
                py-1
                bg-blue-100
                text-blue-600
                rounded-full
                text-sm
                "
              >
                {cat.category_name}
              </span>
            ))}
          </div>

          <h1 className="
          text-5xl
          font-bold
          leading-tight
          ">
            {article.title}
          </h1>

          <div className="
          flex
          gap-6
          mt-4
          text-gray-500
          ">
            <span>
              👤 {article.author?.name}
            </span>

            <span>
              👁 {article.view_count}
            </span>
          </div>

          <div className="
          prose
          max-w-none
          mt-10
          ">
            <div
              dangerouslySetInnerHTML={{
                __html: article.content
              }}
            />
          </div>

        </div>

      </div>

    </section>
  );
}