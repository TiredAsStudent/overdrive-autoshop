import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, History, Activity, Plus, 
  AlertTriangle, CheckCircle2, 
  ChevronRight, Gauge, Calendar,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerGarage = () => {
  // 1. MOCK DATA: Fleet of Vehicles
  const vehicles = [
    {
      plate: 'ABC 1234',
      make: 'Toyota',
      model: 'Hilux Conquest',
      year: '2021',
      lastOdometer: 48200,
      nextServiceKm: 50000,
      lastVisit: '2025-11-20',
      needsAttention: true // Within 5,000km or 6 months
    },
    {
      plate: 'XYZ 9999',
      make: 'Honda',
      model: 'Civic Type R',
      year: '2023',
      lastOdometer: 12000,
      nextServiceKm: 15000,
      lastVisit: '2026-02-15',
      needsAttention: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 2. HEADER: FLEET OVERVIEW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">My Digital Garage</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            Centralized Fleet Management • {vehicles.length} Active Stalls
          </p>
        </div>
        
        <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={16} /> Request New Registration
        </button>
      </div>

      {/* 3. THE DIGITAL STALLS (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {vehicles.map((v, idx) => (
          <motion.div 
            key={v.plate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:border-amber-500/50 transition-all group overflow-hidden"
          >
            <div className="p-8 sm:p-10 space-y-8">
              
              {/* Vehicle Identity Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg tracking-widest">
                      {v.plate}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.year}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter group-hover:text-amber-500 transition-colors">
                    {v.make} {v.model}
                  </h3>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl text-slate-300 group-hover:text-amber-500 transition-colors">
                  <Car size={32} />
                </div>
              </div>

              {/* MAINTENANCE GAUGE (THE ALERT) */}
              {v.needsAttention ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 flex items-start gap-4">
                  <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-600 dark:text-amber-500 uppercase italic tracking-tight">Maintenance Required</h4>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-bold mt-1 leading-relaxed">
  This vehicle is approaching the +5,000 km interval or 6-month threshold. 
  Schedule a check-up to maintain your warranty.
</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-6 flex items-start gap-4">
                  <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase italic tracking-tight">Status: Nominal</h4>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-bold mt-1 leading-relaxed">
                      All systems verified. Next predicted service at {v.nextServiceKm.toLocaleString()} KM.
                    </p>
                  </div>
                </div>
              )}

              {/* QUICK ACTION HUB */}
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  to="/customer/dashboard/status"
                  className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all group/btn"
                >
                  <Activity size={24} className="mb-2 text-blue-500 group-hover/btn:text-white dark:group-hover/btn:text-slate-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest">View Status</span>
                </Link>

                <Link 
                  to="/customer/history/timeline"
                  className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all group/btn"
                >
                  <History size={24} className="mb-2 text-amber-500 group-hover/btn:text-white dark:group-hover/btn:text-slate-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest">View History</span>
                </Link>
              </div>

            </div>

            {/* Bottom Tech-Spec Bar */}
            <div className="px-10 py-5 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Gauge size={12} /> {v.lastOdometer.toLocaleString()} KM
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <Calendar size={12} /> Last Visit: {v.lastVisit}
                 </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. FLEET PROTECTION DISCLOSURE */}
      <div className="p-8 bg-blue-50 dark:bg-blue-500/5 rounded-[40px] border border-blue-100 dark:border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-blue-500 shadow-sm">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase italic">Enterprise Fleet Security</h4>
            <p className="text-[11px] text-blue-700/70 dark:text-blue-300/60 font-medium leading-relaxed max-w-xl mt-1">
              "Your Garage" is protected by our cross-branch unified database. All vehicle data is encrypted and synced in real-time, 
              ensuring that whether your car is in Batino or the Main branch, its Digital Stall is always up to date.
            </p>
          </div>
        </div>
        <div className="px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fleet Value Verified</p>
           <p className="text-lg font-black text-blue-600 dark:text-blue-400 italic tracking-tighter uppercase">Fully Authenticated</p>
        </div>
      </div>

    </div>
  );
};

export default CustomerGarage;