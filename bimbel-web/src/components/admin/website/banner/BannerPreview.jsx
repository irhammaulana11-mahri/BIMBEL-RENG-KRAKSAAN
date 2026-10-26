export default function BannerPreview({preview,}) {
  return (
    <div className="border rounded-xl overflow-hidden bg-slate-50">
      {preview ? (
        <img src={preview} alt="Banner Preview" className="w-full h-64 object-cover"/>
      ) : (
        <div className=" h-64 flex items-center justify-center text-gray-400">Belum ada banner</div>
      )}
    </div>
  );
}