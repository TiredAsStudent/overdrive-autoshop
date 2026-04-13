import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Trash2, Edit, 
  Calculator, ShieldCheck, Tag, Wrench,
  Search, Info, AlertCircle
} from 'lucide-react';

const AdminServices = () => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Mock Data: The "Recipe Book"
  const [services] = useState([
    { 
      id: 'S-001', 
      name: 'Premium Oil Change (Sedan)', 
      category: 'Maintenance', 
      parts: [
        { name: 'Fully Synthetic Oil', cost: 850, qty: 4 },
        { name: 'Genuine Oil Filter', cost: 450, qty: 1 }
      ],
      labor: 500,
      markup: 1.25, // 25% Markup
      lastUpdated: '2 hours ago'
    },
    { 
      id: 'S-002', 
      name: 'Brake System Flush', 
      category: 'Brakes', 
      parts: [
        { name: 'Brake Fluid (DOT 4)', cost: 350, qty: 2 }
      ],
      labor: 800,
      markup: 1.25,
      lastUpdated: '1 day ago'
    }
  ]);

  const calculateTotal = (service) => {
    const partsTotal = service.parts.reduce((acc, p) => acc + (p.cost * p.qty), 0);
    const markedUpParts = partsTotal * service.markup;
    const subtotal = markedUpParts + service.labor;
    const tax = subtotal * 0.12;
    return subtotal + tax;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. HEADER & FORMULA VISUAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">The Recipe Book</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            Configure standardized service packages. Prices update automatically when supplier costs change in the Approval Queue.
          </p>
          
          <div className="mt-6 p-4 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-[10px] font-black uppercase text-amber-500 mb-2 flex items-center gap-2">
              <Calculator size={12} /> Global Pricing Formula
            </p>
           <div className="text-white font-mono text-sm overflow-x-auto pb-2">
  {`$$Total = (\\sum \\text{Parts Cost} \\times \\text{Global Markup}) + \\text{Labor Fee} + \\text{Tax}$$`}
</div>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-4 bg-amber-500 dark:bg-overdrive-yellow text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-amber-500/20 uppercase text-sm"
        >
          <Plus size={20} /> Create New Combo Meal
        </button>
      </div>

      {/* 2. SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <motion.div 
            key={service.id}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-start">
              <div>
                <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {service.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">{service.name}</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                  <Edit size={18} />
                </button>
                <button className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recipe Requirements</p>
                {service.parts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-gray-300">
                    <span className="flex items-center gap-2"><Package size={14} className="opacity-40" /> {p.name} (x{p.qty})</span>
                    <span className="font-mono text-xs opacity-60">₱{p.cost} ea</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm font-bold text-amber-600 dark:text-overdrive-yellow">
                  <span className="flex items-center gap-2"><Wrench size={14} /> Labor Fee</span>
                  <span>₱{service.labor}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase">
                    <ShieldCheck size={12} /> Inflation Guard Active
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Cost verified {service.lastUpdated}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Standard Retail Price</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    ₱{calculateTotal(service).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. NEW SERVICE MODAL (PREVIEW) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">New Combo Meal Builder</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"><Trash2 size={24} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Inputs */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Service Title</label>
                    <input type="text" placeholder="e.g. Engine Overhaul" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Link Global Inventory Parts</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" placeholder="Search SKU or Name..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-amber-500 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Labor Fee (Mandatory for Accounting)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                      <input type="number" defaultValue="0" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 font-bold dark:text-white focus:border-amber-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Preview */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Calculator size={120} />
                  </div>
                  <h4 className="text-xs font-black uppercase text-amber-500 mb-8 tracking-widest">Live Price Breakdown</h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">Sum of Parts Cost</span>
                      <span className="font-mono">₱0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold">Global Markup (25%)</span>
                      <span className="text-emerald-400 font-mono">+₱0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold text-amber-500">Fixed Labor Fee</span>
                      <span className="font-mono">₱0.00</span>
                    </div>
                    <div className="pt-6 mt-6 border-t border-white/10">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500">Total Customer Price</p>
                          <p className="text-4xl font-black text-white italic">₱0.00</p>
                        </div>
                        <p className="text-[10px] text-slate-500 text-right italic font-bold">Inc. 12% VAT</p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-12 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase text-sm hover:bg-amber-500 transition-colors shadow-xl">
                    Save to Recipe Book
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminServices;