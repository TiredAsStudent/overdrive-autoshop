import React from "react";
import { Package, Plus } from "lucide-react";

const SERVICE_TEMPLATES = [
  {
    id: "t1",
    name: "Premium Oil Change",
    items: [
      {
        desc: "Fully Synthetic Oil",
        qty: 1,
        price: 4500,
        ocrCost: 3800,
        type: "inventory",
      },
      {
        desc: "Oil Filter",
        qty: 1,
        price: 850,
        ocrCost: 450,
        type: "inventory",
      },
      { desc: "Labor", qty: 1, price: 500, ocrCost: 0, type: "service" },
    ],
  },
  {
    id: "t2",
    name: "Brake Service (Front)",
    items: [
      {
        desc: "Brake Pads",
        qty: 1,
        price: 2200,
        ocrCost: 1250,
        type: "inventory",
      },
      {
        desc: "Brake Cleaner",
        qty: 1,
        price: 350,
        ocrCost: 150,
        type: "inventory",
      },
      { desc: "Labor", qty: 1, price: 800, ocrCost: 0, type: "service" },
    ],
  },
];

export const ServiceTemplateSelector = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {SERVICE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl hover:border-amber-500 transition-all group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <Package size={18} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {template.name}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                Standard Combo
              </p>
            </div>
          </div>
          <Plus
            size={18}
            className="text-slate-400 group-hover:text-amber-500 transition-colors"
          />
        </button>
      ))}
    </div>
  );
};
