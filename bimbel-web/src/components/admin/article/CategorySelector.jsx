import { useEffect, useState } from "react";
import { getCategories } from "../../../services/articleCategoryService";

export default function CategorySelector({value = [],onChange,}) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const res = await getCategories();
    console.log("categories", res);
    setCategories(res.data.data || []);
  };

  const toggleCategory = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium">Kategori Artikel</label>
      <div className="grid md:grid-cols-2 gap-2">
        {categories.map((item) => (
          <label key={item.id} className="flex items-center gap-2 border rounded-xl p-3 cursor-pointer">
            <input type="checkbox" checked={value.includes(item.id)} onChange={() => toggleCategory(item.id)}/>
            {item.category_name}
          </label>
        ))}
      </div>
    </div>
  );
}