import React from 'react';
import { Trash2, Plus } from 'lucide-react';

const LineItemBuilder = ({ items, setItems }) => {
  const addItem = () => setItems([...items, { desc: '', qty: 1, price: 0 }]);
  
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 dark:border-white/5">
              <th className="pb-3 px-2">Description</th>
              <th className="pb-3 px-2 w-20">Qty</th>
              <th className="pb-3 px-2 w-32">Unit Price</th>
              <th className="pb-3 px-2 w-32 text-right">Total</th>
              <th className="pb-3 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {items.map((item, index) => (
              <tr key={index} className="group">
                <td className="py-3 px-2">
                  <input 
                    type="text" value={item.desc} placeholder="Service or Part name"
                    onChange={(e) => updateItem(index, 'desc', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium dark:text-white"
                  />
                </td>
                <td className="py-3 px-2">
                  <input 
                    type="number" value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                  />
                </td>
                <td className="py-3 px-2">
                  <input 
                    type="number" value={item.price}
                    onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-white"
                  />
                </td>
                <td className="py-3 px-2 text-right text-sm font-bold dark:text-gray-200">
                  ₱{(item.qty * item.price).toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right">
                  <button onClick={() => removeItem(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button 
        onClick={addItem}
        className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-overdrive-yellow hover:opacity-80 transition-opacity"
      >
        <Plus size={14} /> Add Custom Line Item
      </button>
    </div>
  );
};

export default LineItemBuilder;