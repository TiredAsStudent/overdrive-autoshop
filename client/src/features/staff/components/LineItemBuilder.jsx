import React from "react";
import { Trash2, Database, ShieldAlert, ChevronDown } from "lucide-react";

// MOCK INVENTORY DATABASE: This simulates pulling from your PostgreSQL backend
const INVENTORY_DB = [
  {
    id: "i1",
    desc: "Standard Wiper Blade (20-inch)",
    price: 800,
    ocrCost: 400,
    type: "inventory",
  },
  {
    id: "i2",
    desc: "Ceramic Brake Pads",
    price: 2500,
    ocrCost: 1200,
    type: "inventory",
  },
  {
    id: "i3",
    desc: "10W-40 Synthetic Motor Oil (1L)",
    price: 650,
    ocrCost: 450,
    type: "inventory",
  },
  {
    id: "i4",
    desc: "Cabin Air Filter",
    price: 1200,
    ocrCost: 700,
    type: "inventory",
  },
  {
    id: "i5",
    desc: "Spark Plug (Iridium)",
    price: 950,
    ocrCost: 550,
    type: "inventory",
  },
];

export const LineItemBuilder = ({ items, setItems }) => {
  const handleAddTrackedItem = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return; // Ignore if they click the placeholder

    const itemToAdd = INVENTORY_DB.find((i) => i.id === selectedId);
    if (itemToAdd) {
      // Add to current items list with a default quantity of 1
      setItems([...items, { ...itemToAdd, qty: 1 }]);
    }
    // Reset the dropdown back to default
    e.target.value = "";
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] uppercase font-black text-slate-400 border-b border-slate-200 dark:border-white/10">
              <th className="py-3 px-4">Description & Type</th>
              <th className="py-3 px-4 w-24">Qty</th>
              <th className="py-3 px-4 w-40">Unit Price</th>
              <th className="py-3 px-4 w-32 text-right">Total</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {items.map((item, index) => {
              const isBelowCost =
                item.type === "inventory" && item.price < item.ocrCost;
              return (
                <tr key={index} className="group bg-white dark:bg-slate-800">
                  <td className="py-3 px-4">
                    <p className="w-full text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {item.desc}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {item.type === "inventory" ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                          <Database size={10} /> Tracked SKU
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                          Service / Labor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(index, "qty", parseInt(e.target.value) || 0)
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 focus:border-amber-500 text-sm font-bold dark:text-white outline-none"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                        ₱
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-sm font-bold outline-none transition-colors dark:bg-slate-900 ${
                          isBelowCost
                            ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-500/10"
                            : "border-slate-200 dark:border-white/10 dark:text-white focus:border-amber-500"
                        }`}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-black text-slate-900 dark:text-white">
                    ₱{(item.qty * item.price).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 pt-2">
        {/* IMPROVED: Inventory Item Selector */}
        <div className="relative w-64">
          <select
            onChange={handleAddTrackedItem}
            className="w-full appearance-none bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            <option value="">+ Add Tracked Inventory Item</option>
            {INVENTORY_DB.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.desc} - ₱{inv.price}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
