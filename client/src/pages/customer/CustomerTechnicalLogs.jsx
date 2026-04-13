import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSearch, Package, Wrench, 
  ShieldCheck, Info, ArrowLeft,
  ChevronRight, BadgeCheck, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerTechnicalLogs = () => {
  // 1. MOCK DATA: Pulling from "Step 3: Finalized Invoices"
  const [activeJob] = useState({
    id: 'JOB-901',
    date: 'April 10, 2026',
    odometer: '45,000 KM',
    branch: 'Batino Branch',
    parts: [
      { name: 'Fully Synthetic Oil', brand: 'Shell Helix Ultra', sku: '5W-40-PRO', qty: '8L' },
      { name: 'Oil Filter', brand: 'Toyota Genuine', sku: '90915-YZZD2', qty: '1' },
      { name: 'Ceramic Brake Pads', brand: 'Brembo', sku: 'P83-102N', qty: '1 Set' },
    ],
    labor: [
      { task: 'Engine Oil Flushing & Refilling', duration: '45 mins' },
      { task: '4-Wheel Brake Cleaning & Adjustment', duration: '60 mins' },
      { task: 'Digital Scanning & ECU Health Check', duration: '20 mins' },
    ]
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 2. HEADER: CONTEXT SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/customer/history/timeline" className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft size={12} /> Back to Timeline
          </Link>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Technical Deep Dive</h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center gap-2">
            Ref: <span className="text-slate-900">{activeJob.id}</span> • {activeJob.date}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl">
          <ShieldCheck className="text-emerald-500" size={20} />
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Integrity Lock</p>
            <p className="text-[9px] font-bold text-emerald-800 opacity-60 uppercase">Admin Verified Record</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 3. PARTS LOG (THE PROOF) */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Parts Inventory Log</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hardware Utilized</p>
            </div>
          </div>

          <div className="space-y-4">
            {activeJob.parts.map((item, idx) => (
              <div key={idx} className="group p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{item.name}</p>
                  <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg shadow-sm">x{item.qty}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100 uppercase tracking-tighter">
                    Brand: {item.brand}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-1 bg-white text-slate-500 rounded-md border border-slate-200 uppercase tracking-tighter">
                    SKU: {item.sku}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. LABOR LOG (THE EXPERTISE) */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Workmanship Log</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Service Labor Breakdown</p>
            </div>
          </div>

          <div className="space-y-4">
            {activeJob.labor.map((work, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl group">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <p className="text-xs font-bold text-slate-700 leading-tight uppercase tracking-tight">{work.task}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                  <Zap size={10} className="text-amber-500" /> {work.duration}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
             <div className="flex items-center gap-3 text-emerald-600">
                <BadgeCheck size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Technician Quality Assured</p>
             </div>
          </div>
        </section>
      </div>

      {/* 5. THE INTEGRITY LOCK NOTICE */}
      <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden">
        <div className="absolute left-0 bottom-0 p-8 opacity-5">
          <FileSearch size={150} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h4 className="text-xl font-black italic uppercase tracking-tight">Audit Trail Transparency</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl">
              This technical log is pulled exclusively from <strong>Step 3: Finalized Invoices</strong>. This prevents draft information from appearing and ensures that only data approved by our Enterprise Administrators is visible in your Service Passport.
            </p>
          </div>
          <button className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
            Download Tech Specs (PDF)
          </button>
        </div>
      </div>

    </div>
  );
};

export default CustomerTechnicalLogs;