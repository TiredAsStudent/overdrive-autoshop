import React from 'react';
import { Package, Plus } from 'lucide-react';

const SERVICE_TEMPLATES = [
  { id: 't1', name: 'Premium Oil Change', items: [{ desc: 'Fully Synthetic Oil', price: 4500 }, { desc: 'Oil Filter', price: 850 }, { desc: 'Labor', price: 500 }] },
  { id: 't2', name: 'Brake Service (Front)', items: [{ desc: 'Brake Pads', price: 2200 }, { desc: 'Brake Cleaner', price: 350 }, { desc: 'Labor', price: 800 }] },
];

const ServiceTemplateSelector = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {SERVICE_TEMPLATES.map(template => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl hover:border-amber-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <Package size={18} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{template.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Combo Meal</p>
            </div>
          </div>
          <Plus size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
        </button>
      ))}
    </div>
  );
};

export default ServiceTemplateSelector;