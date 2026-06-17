export default function FaqPreview({form,}) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="p-5 border-b bg-slate-50">
        <h3 className="font-semibold">Preview FAQ</h3>
      </div>
      <div className="p-6">
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-3 font-medium">
            {form.question || "Pertanyaan FAQ"}
          </div>
          <div className="p-4 text-gray-600">
            {form.answer || "Jawaban FAQ akan tampil di sini..."}
          </div>
        </div>
      </div>
    </div>
  );
}