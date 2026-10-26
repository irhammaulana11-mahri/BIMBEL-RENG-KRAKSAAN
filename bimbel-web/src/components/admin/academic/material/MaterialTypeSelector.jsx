import React from "react";
import { ArrowLeft } from "lucide-react";
import { MATERIAL_TYPES } from "../../../../components/constants/material.constants";

export default function MaterialTypeSelector({ curriculum, onBack, onSelectType }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Inline Navigation */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-black text-gray-950">{curriculum.title}</h3>
          <p className="text-[13px] text-gray-400 font-bold">Tambah Resource Belajar</p>
        </div>
      </div>

      {/* Pilihan Tipe Material Inline */}
      <div className="grid grid-cols-1 gap-2.5">
        {Object.values(MATERIAL_TYPES).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              onClick={() => onSelectType(item.key)}
              className="p-3.5 rounded-2xl border border-gray-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 flex items-center gap-3.5 cursor-pointer group transition-all"
            >
              <div className={`p-2.5 rounded-xl border ${item.badgeBg} group-hover:scale-105 transition-transform shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.label}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}