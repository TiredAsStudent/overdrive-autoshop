import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, FileText, ShoppingCart, 
  ChevronRight, Download, Printer, 
  CheckCircle, AlertCircle, PackagePlus,
  ArrowRight
} from 'lucide-react';

const BulkOrderBuilder = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 1. MOCK DATA: Aggregated shortages found after scan
  const [shortages] = useState([
    { 
      id: 'P-101', 
      name: 'Fully Synthetic Oil (1L)', 
      sku: 'OIL-FS-01', 
      needs: { main: 0, second: 15, third: 0 }, 
      totalNeeded: 15,
      unitCost: 850
    },
    { 
      id: 'P-102', 
      name: 'Genuine Oil Filter (Toyota)', 
      sku: 'FIL-TY-99', 
      needs: { main: 25, second: 0, third: 18 }, 
      totalNeeded: 43,
      unitCost: 450
    },
    { 
      id: 'P-105', 
      name: 'Brake Fluid (DOT 4)', 
      sku: 'FLU-BF-04', 
      needs: { main: 5, second: 5, third: 5 }, 
      totalNeeded: 15,
      unitCost: 350
    }
  ]);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowResults(true);
    }, 2000);
  };

  const grandTotal = shortages.reduce((acc, item) => acc + (item.totalNeeded * item.unitCost), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. SCANNING INTERFACE */}
      {!showResults ? (
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-8 relative overflow-hidden">
            <div className="h-24 w-24 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 relative">
              <Scan size={48} className={`text-slate-900 ${isScanning ? 'animate-pulse' : ''}`} />
              {isScanning && (
                <motion.div 
                  initial={{ top: 0 }} animate={{ top: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-white/50 blur-sm"
                />
              )}
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Enterprise Scan</h2>
              <p className="text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                Click below to identify every item across all 3 branches that has fallen below its healthy stock threshold.
              </p>
            </div>

            <button 
              onClick={runScan}
              disabled={isScanning}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 group"
            >
              {isScanning ? 'Processing Database...' : 'Run Global Shortage Scan'}
              {!isScanning && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      ) : (
        /* 3. AUTOMATED SHOPPING LIST VIEW */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status="Scan Complete" type="success" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Shortages Found</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Bulk Purchase Request</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowResults(false)} className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold rounded-xl text-sm transition-all">
                Reset Scan
              </button>
              <button className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 text-sm">
                <Download size={18} /> Export PDF List
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Shortage Table */}
            <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-4">Part Details</th>
                    <th className="px-6 py-4 text-center">Main</th>
                    <th className="px-6 py-4 text-center">Second</th>
                    <th className="px-6 py-4 text-center">Third</th>
                    <th className="px-6 py-4 text-right">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {shortages.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                      </td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">+{item.needs.main}</td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">+{item.needs.second}</td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">+{item.needs.third}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl font-black text-sm">
                          {item.totalNeeded}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-8 opacity-5">
                <ShoppingCart size={150} />
              </div>
              <div className="space-y-8 z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Order Estimation</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Total SKUs Needed</span>
                    <span>{shortages.length} Items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-bold">Total Quantity</span>
                    <span>{shortages.reduce((acc, i) => acc + i.totalNeeded, 0)} Units</span>
                  </div>
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Estimated Purchase Value</p>
                    <p className="text-4xl font-black text-white italic">₱{grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-12 z-10">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    Final totals will depend on vendor pricing approved in the OCR module upon delivery.
                  </p>
                </div>
                <button className="w-full py-4 bg-overdrive-yellow text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Printer size={16} /> Print Shopping List
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkOrderBuilder;