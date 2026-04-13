import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, UserCheck, Send, 
  MessageSquare, ChevronRight, Activity, 
  ShieldCheck, Phone
} from 'lucide-react';

const CustomerDashboard = () => {
  const [stage, setStage] = useState(2); // Mock: 1: Pending, 2: Ongoing, 3: Ready
  const [comment, setComment] = useState('');

  const getStageStyles = (current) => {
    if (stage === current) return "bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20";
    if (stage > current) return "bg-emerald-500 text-white shadow-sm";
    return "bg-slate-100 text-slate-400";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 1. LIVE STATUS TRACKER */}
      <section className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={120} /></div>
        
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Live Service Tracker</h3>
          <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" /> Live from Bay
          </span>
        </div>

        {/* 3-Stage Progress Bar */}
        <div className="relative flex justify-between items-center px-4 mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-white/5 -z-0" />
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`h-12 w-12 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center transition-all duration-500 ${getStageStyles(s)}`}>
                {stage > s ? <ShieldCheck size={20} /> : <span className="font-black text-sm">{s}</span>}
              </div>
              <p className={`text-[10px] font-black uppercase ${stage >= s ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {s === 1 ? 'Pending' : s === 2 ? 'Ongoing' : 'Ready'}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-black/20 rounded-3xl p-6 border border-slate-100 dark:border-white/5">
           <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed italic">
             {stage === 2 ? "“Work in progress. Parts have been reserved and labor is underway in the service bay.”" : "Awaiting status update..."}
           </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 2. THE INSTRUCTION LOOP */}
        <section className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-sm p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare size={18} className="text-amber-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions for the Team</h3>
          </div>
          
          <textarea 
            placeholder="e.g. Please check the weird noise in the rear left tire..."
            className="flex-1 w-full bg-slate-50 dark:bg-black/20 rounded-2xl p-4 text-sm font-medium outline-none focus:border-amber-500 border border-transparent transition-all min-h-[120px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          
          <button className="mt-4 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
            <Send size={14} /> Update Instructions
          </button>
        </section>

        {/* 3. ACTIVE CONTEXT (BRANCH & MECHANIC) */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex items-center gap-5">
            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Service Location</p>
              <h4 className="text-lg font-black dark:text-white uppercase italic">Batino Branch</h4>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12}/> 049-555-0001</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex items-center gap-5">
            <div className="h-14 w-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Assigned Mechanic</p>
              <h4 className="text-lg font-black dark:text-white uppercase italic">Juan Dela Cruz</h4>
              <p className="text-[10px] font-bold text-amber-600 dark:text-overdrive-yellow uppercase">Suspension Expert</p>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
};

export default CustomerDashboard;