import { useEffect, useState } from "react";
import { getFaqs } from "../../services/faqService";

export default function FaqSection() {
  const [faqs, setFaqs] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      const res = await getFaqs();
      setFaqs(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setActive(
                    active === index ? null : index
                  )
                }
                className="w-full flex justify-between items-center p-5 font-semibold text-left"
              >
                {item.question}

                <span>
                  {active === index ? "-" : "+"}
                </span>
              </button>

              {active === index && (
                <div className="px-5 pb-5 text-gray-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}