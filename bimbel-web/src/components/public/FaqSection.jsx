import { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";
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
      setFaqs(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-blue-600 font-semibold">FAQ</span>
          <h2 className="text-4xl lg:text-5xl font-bold mt-3">Pertanyaan Umum</h2>
          <p className="text-gray-500 mt-5">
            Temukan jawaban atas pertanyaan
            yang paling sering ditanyakan
            mengenai program belajar,
            biaya, jadwal dan pendaftaran.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-4xl mx-auto space-y-5">
          {faqs.map((item, index) => {
            const isOpen = active === index;

            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden transition-all">
                <button onClick={() => setActive(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left"
                >
                  <span className="text-lg font-semibold">{item.question}</span>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    {isOpen ? (<Minus size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </div>
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-96" : "max-h-0"}`}>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t">
                    <div className="pt-5">{item.answer}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}