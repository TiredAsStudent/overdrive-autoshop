import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Download, AlertTriangle, 
  Package, Layers, Database, ArrowRightLeft, // 'Layers' must be capitalized
  Info 
} from 'lucide-react';
const AdminStockOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. MOCK DATA: Unified Enterprise Inventory
  const [globalInventory] = useState([
    { 
      id: 'P-101', 
      name: 'Fully Synthetic Oil (1L)', 
      sku: 'OIL-FS-01', 
      category: 'Lubricants', 
      min: 50,
      branches: {
        main: { qty: 120, reserved: 15 },
        second: { qty: 45, reserved: 5 }, // Red Status (Below 50)
        third: { qty: 85, reserved: 10 }
      }
    },
    { 
      id: 'P-102', 
      name: 'Genuine Oil Filter (Toyota)', 
      sku: 'FIL-TY-99', 
      category: 'Filters', 
      min: 30,
      branches: {
        main: { qty: 15, reserved: 2 }, // Red Status (Below 30)
        second: { qty: 42, reserved: 8 },
        third: { qty: 12, reserved: 0 }  // Red Status (Below 30)
      }
    },
    { 
      id: 'P-103', 
      name: 'Ceramic Brake Pads (Set)', 
      sku: 'BRK-CE-05', 
      category: 'Brakes', 
      min: 15,
      branches: {
        main: { qty: 25, reserved: 12 }, // Blue Status (High Reserved)
        second: { qty: 18, reserved: 2 },
        third: { qty: 20, reserved: 4 }
      }
    }
  ]);

  const getStatusColor = (qty, min, reserved) => {
    if (qty <= min) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (reserved > (qty * 0.3)) return 'text-blue-500 bg-blue-500/10 border-blue-500/20'; // >30% reserved
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. TOP LEVEL ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total SKUs</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white italic">1,240</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-red-500">Alerts: Out of Stock</p>
          <h3 className="text-2xl font-black text-red-500 italic">12 Items</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-blue-500">Globally Reserved</p>
          <h3 className="text-2xl font-black text-blue-500 italic">156 Units</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Inventory Value</p>
          <h3 className="text-2xl font-black text-emerald-500 italic">₱2.4M</h3>
        </div>
      </div>

      {/* 3. MULTI-BRANCH TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search Global SKU or Part Name..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500"><Filter size={18} /></button>
            <button className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500"><Download size={18} /></button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-4">Part Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-center bg-blue-500/5">Main Branch</th>
              <th className="px-6 py-4 text-center bg-amber-500/5">Batino Branch</th>
              <th className="px-6 py-4 text-center bg-purple-500/5">Third Branch</th>
              <th className="px-6 py-4 text-right">Min. Lvl</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {globalInventory.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">{item.sku}</p>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                    {item.category}
                  </span>
                </td>
                
                {/* BRANCH COLUMNS */}
                {['main', 'second', 'third'].map((branchKey) => {
                  const data = item.branches[branchKey];
                  const statusClass = getStatusColor(data.qty, item.min, data.reserved);
                  return (
                    <td key={branchKey} className="px-6 py-5 text-center">
                      <div className={`inline-flex flex-col items-center justify-center min-w-[70px] py-2 rounded-2xl border transition-all ${statusClass}`}>
                        <span className="text-sm font-black">{data.qty}</span>
                        {data.reserved > 0 && (
                          <span className="text-[9px] font-bold opacity-70 italic">({data.reserved} Res.)</span>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="px-6 py-5 text-right font-mono text-xs font-bold text-slate-400">
                  {item.min}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. LEGEND & SECURITY FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500/40" /> Healthy
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/40" /> Critical/Low
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
            <div className="h-3 w-3 rounded bg-blue-500/20 border border-blue-500/40" /> High Reservations
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-amber-500 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/20">
          <AlertTriangle size={20} />
          <div>
            <p className="text-[10px] font-black uppercase leading-none">Automated Reorder Logic</p>
            <p className="text-[10px] font-bold opacity-80 mt-1 italic">Red indicators automatically flag items in the Weekly Admin Purchase Report.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStockOverview;