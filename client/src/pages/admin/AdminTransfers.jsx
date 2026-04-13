import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, Truck, PackageCheck, 
  MapPin, Clock, History, Plus, 
  ShieldCheck, AlertCircle, CheckCircle2
} from 'lucide-react';

const AdminTransfers = () => {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'history'

  // 1. MOCK DATA: The Pipeline (Active Moves)
  const [transfers] = useState([
    { 
      id: 'TRF-5502', 
      part: 'Michelin Primacy 4 (18")', 
      qty: 4, 
      from: 'Main Branch', 
      to: 'Batino Branch', 
      status: 'In Transit', 
      timestamp: 'Today, 09:30 AM',
      requestedBy: 'Mike Torres'
    },
    { 
      id: 'TRF-5501', 
      part: 'Ceramic Brake Pads', 
      qty: 2, 
      from: 'Third Branch', 
      to: 'Main Branch', 
      status: 'Pending Approval', 
      timestamp: '2 hours ago',
      requestedBy: 'Santi Gear'
    }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. HEADER & ATOMIC LOGIC VISUAL */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Internal Logistics</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            Move assets between branches. The system uses Atomic Logic to ensure no part is ever lost in transit.
          </p>
          
          <div className="mt-6 p-4 bg-blue-600 rounded-2xl border border-blue-400 shadow-xl shadow-blue-600/20">
            <p className="text-[10px] font-black uppercase text-blue-100 mb-2 flex items-center gap-2">
              <ShieldCheck size={12} /> Atomic Database Sync
            </p>
            <div className="text-white font-mono text-sm">
  {"Branch A (Stock) - X = Branch B (Stock) + X"}
</div>
          </div>
        </div>

        <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg uppercase text-sm">
          <Plus size={20} /> Initiate New Transfer
        </button>
      </div>

      {/* 3. PIPELINE VIEW */}
      <div className="space-y-4">
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit border border-slate-200 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'pipeline' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-500'}`}
          >
            Active Pipeline
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-500'}`}
          >
            Audit Logs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {transfers.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 group"
              >
                {/* Part & Direction */}
                <div className="flex items-center gap-6 flex-1">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${item.status === 'In Transit' ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                    <Truck size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{item.part}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.from}</span>
                      <ArrowRightLeft size={12} className="text-blue-500" />
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.to}</span>
                    </div>
                  </div>
                </div>

                {/* Status Pipeline Visual */}
                <div className="flex items-center gap-4 flex-1 justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-3 w-3 rounded-full ${item.status === 'Pending Approval' ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-emerald-500'}`} />
                    <span className="text-[8px] font-black uppercase text-slate-400">Request</span>
                  </div>
                  <div className={`h-1 w-12 rounded-full ${item.status === 'In Transit' ? 'bg-blue-500' : 'bg-slate-100 dark:bg-white/5'}`} />
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-3 w-3 rounded-full ${item.status === 'In Transit' ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-slate-100 dark:bg-white/5'}`} />
                    <span className="text-[8px] font-black uppercase text-slate-400">Transit</span>
                  </div>
                  <div className="h-1 w-12 rounded-full bg-slate-100 dark:bg-white/5" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-slate-100 dark:bg-white/5" />
                    <span className="text-[8px] font-black uppercase text-slate-400">Received</span>
                  </div>
                </div>

                {/* Meta & Actions */}
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">x{item.qty}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Units</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {item.status === 'Pending Approval' ? (
                      <button className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 transition-all">
                        Approve Move
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock size={14} /> Tracking...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. LOGISTICS SECURITY NOTE */}
      <div className="p-6 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
        <div className="absolute left-0 top-0 p-6 opacity-5">
            <PackageCheck size={120} />
        </div>
        <div className="flex items-start gap-4 z-10">
          <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm tracking-tight">Enterprise Audit Integrity</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1 italic">
              "No-Loss" Guarantee: Every transfer creates a permanent log in the Ledger. The sender is released of responsibility only when the receiver signs off.
            </p>
          </div>
        </div>
        <button className="z-10 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Download Transfer Manifest
        </button>
      </div>
    </div>
  );
};

export default AdminTransfers;