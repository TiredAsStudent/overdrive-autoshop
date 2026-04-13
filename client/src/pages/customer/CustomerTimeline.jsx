import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, Calendar, MapPin, 
  Gauge, ChevronRight, Activity,
  ShieldCheck, AlertTriangle, ArrowUpRight
} from 'lucide-react';

const CustomerTimeline = () => {
  // 1. MOCK DATA: Cross-Branch Unified Feed
  const [vehicleStats] = useState({
    lastOdometer: 45000,
    nextServiceDue: 50000, // Calculated: 45000 + 5000
    totalVisits: 12
  });

  const [history] = useState([
    {
      id: 'JOB-901',
      date: 'April 10, 2026',
      branch: 'Batino Branch',
      odometer: 45000,
      service: 'Major PMS & Brake Fluid Flush',
      type: 'Maintenance'
    },
    {
      id: 'JOB-742',
      date: 'Nov 20, 2025',
      branch: 'Main Branch',
      odometer: 40200,
      service: 'Suspension Tuning & Alignment',
      type: 'Repair'
    },
    {
      id: 'JOB-511',
      date: 'June 15, 2025',
      branch: 'Biñan Branch',
      odometer: 35150,
      service: 'Oil Change & Filter Replacement',
      type: 'Maintenance'
    }
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 2. PREDICTIVE MAINTENANCE ALERT (THE HEALTH GAUGE) */}
      <section className="bg-slate-900 rounded-[40px] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Gauge size={180} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-900">
              <Activity size={20} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Predictive Maintenance</h3>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-4xl font-black italic tracking-tighter uppercase">
                Next Service Due: {vehicleStats.nextServiceDue.toLocaleString()} KM
              </p>
              <p className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" /> 
                Based on your last visit at {vehicleStats.lastOdometer.toLocaleString()} KM
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-black uppercase italic">Healthy</span>
              </div>
            </div>
          </div>

          {/* Progress to next service */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-amber-500 w-[90%] transition-all duration-1000" />
          </div>
        </div>
      </section>

      {/* 3. UNIFIED CROSS-BRANCH FEED (THE TIMELINE) */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 sm:p-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <History className="text-slate-400" size={20} />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Vehicle Timeline</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {vehicleStats.totalVisits} Records Found
          </span>
        </div>

        <div className="space-y-0 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {history.map((entry, idx) => (
            <div key={entry.id} className="relative pl-12 pb-12 group last:pb-0">
              {/* Timeline Node */}
              <div className="absolute left-0 top-1.5 h-9 w-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 group-hover:border-amber-500 transition-colors shadow-sm">
                <Calendar size={14} className="text-slate-400 group-hover:text-amber-500" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">
                      {entry.service}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${entry.type === 'Maintenance' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {entry.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {entry.branch}</span>
                    <span className="flex items-center gap-1 font-mono text-slate-500 underline underline-offset-2 decoration-slate-200 font-black tracking-tighter text-sm italic">
                       {entry.odometer.toLocaleString()} KM
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="text-right hidden md:block">
                     <p className="text-[10px] font-black text-slate-900 uppercase">{entry.date}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Entry</p>
                   </div>
                   <button className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-100 transition-all group-hover:scale-105">
                     <ArrowUpRight size={18} />
                   </button>
                </div>
              </div>
              
              {/* Mobile Date display */}
              <p className="md:hidden mt-2 text-[10px] font-black text-slate-400 uppercase">{entry.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DATA INTEGRITY LOCK FOOTER */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex items-center gap-4">
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
          <ShieldCheck size={20} />
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
          <strong>Integrity Lock:</strong> This timeline is an immutable record synced across the Overdrive network. 
          Entries are finalized by Authorized Admins and cannot be modified by staff, ensuring the long-term resale value of your vehicle.
        </p>
      </div>

    </div>
  );
};

export default CustomerTimeline;