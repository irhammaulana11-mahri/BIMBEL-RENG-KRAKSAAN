export default function FaqForm({form,setForm,}) {
  return (
    <div className="space-y-5">
      <div>
        <label>Pertanyaan</label>
        <input type="text" value={form.question} onChange={(e) => setForm({...form,question:e.target.value,})}
          className="w-full border rounded-xl p-3"/>
      </div>

      <div>
        <label>Jawaban</label>
        <textarea rows={8} value={form.answer} onChange={(e) => setForm({...form,answer:e.target.value,})}
          className="w-full border rounded-xl p-3"
        />
      </div>

      <div>
        <label>Urutan</label>
        <input type="number" value={form.sort_order} onChange={(e) => setForm({...form,sort_order:Number(e.target.value),})}
          className="w-full border rounded-xl p-3"
        />
      </div>

      <div>
        <label className="flex gap-3">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form,is_active:e.target.checked,})}
          />
          FAQ Aktif
        </label>
      </div>
    </div>
  );
}