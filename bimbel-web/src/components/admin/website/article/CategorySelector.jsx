import React, { useEffect, useState } from "react";
import { getCategories } from "../../../../services/articleCategoryService";

export default function CategorySelector({ value = [], onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleCategory = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Kategori Keterkaitan Artikel</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map((item) => (
          <label key={item.id} className={`flex items-center gap-2.5 border rounded-xl p-3 cursor-pointer select-none transition-all ${value.includes(item.id) ? "bg-blue-50/50 border-blue-200 text-blue-700 font-bold" : "bg-white border-gray-200 text-gray-700 font-semibold hover:bg-gray-50/50"}`}>
            <input type="checkbox" checked={value.includes(item.id)} onChange={() => toggleCategory(item.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-xs uppercase tracking-wide">{item.category_name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}