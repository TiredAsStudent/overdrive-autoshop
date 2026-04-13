import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, AlertCircle, 
  Info, ShieldCheck, ArrowRight,
  Package, Wrench, Download, Printer
} from 'lucide-react';

const CustomerEstimates = () => {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. MOCK DATA: Step 1 Estimate
  const estimate = {
    id: 'EST-2026-880',
    date: 'April 13, 2026',
    branch: 'Batino Branch',
    subTotal: 12500,
    tax: 1500,
    total: 14000,
    parts: [
      { name: 'Fully Synthetic Oil', price: 4800, qty: '8L' },
      { name: 'Genuine Oil Filter', price: 1200, qty: '1' },
    ],
    labor: [
      { task: 'Major PMS Service Labor', price: 4500 },
      { task: 'Engine Detail & Wash', price: 2000 },
    ]
  };

  const handleApprove = () => {
    setLoading(true);
    // Simulate Backend: Notify Staff -> Reserve Inventory -> Convert to Sales Order
    setTimeout(() => {
      setLoading(false);
      setIsApproved(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 2. HEADER: ACTION STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Proposed Service Estimate</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            {estimate.id} • Issued by {estimate.branch}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. LINE ITEM TRANSPARENCY (THE BREAKDOWN) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Parts Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Package size={14} /> Recommended Parts
                </div>
                {estimate.parts.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Quantity: {item.qty}</p>
                    </div>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white">₱{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Labor Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Wrench size={14} /> Expert Labor
                </div>
                {estimate.labor.map((work, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{work.task}</p>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white">₱{work.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="bg-slate-50 dark:bg-white/5 p-8 border-t border-slate-100 dark:border-white/10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Quote (Inc. VAT)</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">₱{estimate.total.toLocaleString()}</h3>
              </div>
              <div className="text-right text-[10px] font-bold text-slate-400 uppercase italic">
                Valid for 7 days
              </div>
            </div>
          </section>
        </div>

        {/* 4. THE GO-AHEAD TRIGGER (ACTION PANEL) */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!isApproved ? (
              <motion.div 
                key="approval-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-xl space-y-6"
              >
                <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Approve Work</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    By clicking approve, you authorize our team to proceed with the services listed. This will instantly reserve your parts in our inventory.
                  </p>
                </div>
                
                <button 
                  onClick={handleApprove}
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'PROCESSING...' : 'CONFIRM & START WORK'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="success-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-500/20 space-y-6"
              >
                <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Work Authorized</h3>
                  <p className="text-xs font-medium opacity-90 mt-2 leading-relaxed">
                    Your digital signature has been recorded. The workshop team has been notified and inventory is now reserved for your vehicle.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                    <Info size={14} /> Estimate converted to Sales Order
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/20 flex items-start gap-4">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold leading-relaxed italic">
              Need to change something? Use "The Loop" in your Dashboard to send a direct instruction to the Service Advisor before approving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEstimates;