export default function RecentArticles({data = [],}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-bold text-lg mb-4">Artikel Terbaru</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="border-b pb-3 ">
            <h4 className="font-semibold">{item.title}</h4>
            <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}