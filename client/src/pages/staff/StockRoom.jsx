import React, { useState } from 'react';
import { Search, Globe, AlertTriangle, Package, ArrowRightLeft, Info } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const StockRoom = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data: Local Inventory for the current branch
  const [inventory] = useState([
    { id: 'p1', sku: 'OIL-FS-001', name: 'Fully Synthetic Oil (1L)', category: 'Lubricants', unit: 'Bottle', qty: 45, reserved: 8, min: 20 },
    { id: 'p2', sku: 'FIL-G-99', name: 'Genuine Oil Filter (Toyota)', category: 'Filters', unit: 'Piece', qty: 5, reserved: 2, min: 10 },
    { id: 'p3', sku: 'TIR-ML-18', name: 'Michelin Primacy 4 (18")', category: 'Tires', unit: 'Piece', qty: 12, reserved: 0, min: 4 },
    { id: 'p4', sku: 'BRK-PD-02', name: 'Brake Pads (Ceramic)', category: 'Brakes', unit: 'Set', qty: 8, reserved: 4, min: 5 },
  ]);

  const getRowStatus = (item) => {
    const available = item.qty - item.reserved;
    if (item.qty <= item.min) return 'red'; // Low Stock
    if (item.reserved > 0) return 'blue';   // Committed/Reserved
    return 'green';                         // Healthy
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 1. TOP ACTIONS: Search & Global Query */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Part Name or SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="w-full lg:w-auto px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
          <Globe size={18} /> Search Other Branches
        </button>
      </div>

      {/* 2. THE LOCAL SHELF VIEW */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Part Info</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Physical</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Reserved</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Available</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {inventory.map((item) => {
              const status = getRowStatus(item);
              const available = item.qty - item.reserved;

              return (
                <tr key={item.id} className="group transition-colors">
                  {/* Part Details */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        status === 'red' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                        status === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
                        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                      }`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{item.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </td>

                  {/* Physical Count */}
                  <td className="px-6 py-5 text-center">
                    <p className={`text-sm font-black ${status === 'red' ? 'text-red-500' : 'text-slate-700 dark:text-gray-300'}`}>
                      {item.qty} <span className="text-[10px] font-normal opacity-50 uppercase">{item.unit}</span>
                    </p>
                  </td>

                  {/* Reserved (The Blue Logic) */}
                  <td className="px-6 py-5 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                      item.reserved > 0 ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 'text-slate-300'
                    }`}>
                      {item.reserved > 0 && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      {item.reserved} Locked
                    </div>
                  </td>

                  {/* Available to Sell */}
                  <td className="px-6 py-5 text-center">
                    <p className={`text-lg font-black ${available <= 0 ? 'text-red-500 opacity-30' : 'text-slate-900 dark:text-white'}`}>
                      {available}
                    </p>
                  </td>

                  {/* Enterprise Action */}
                  <td className="px-6 py-5 text-right">
                    {status === 'red' ? (
                      <button className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow hover:opacity-80 transition-opacity">
                        <ArrowRightLeft size={14} /> Request Transfer
                      </button>
                    ) : (
                      <button className="text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <Info size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER LEGEND */}
      <div className="flex flex-wrap gap-6 px-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <div className="h-3 w-3 rounded bg-emerald-500" /> Healthy Stock
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <div className="h-3 w-3 rounded bg-red-500" /> Critical (Restock Required)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase animate-pulse">
          <div className="h-3 w-3 rounded bg-blue-500" /> Reserved for Ongoing Repair
        </div>
      </div>
    </div>
  );
};

export default StockRoom;