import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Trophy, Clock, UserCheck, 
  PackageSearch, Zap, ArrowRight, ChevronDown 
} from 'lucide-react';

const BranchRanking = () => {
  const [metric, setMetric] = useState('revenue'); // 'revenue' | 'profit' | 'volume'
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');

  // Mock Data: Comparative Branch Performance
  const branchData = {
    'Main Branch': { 
      revenue: 142000, profit: 88000, volume: 156, efficiency: '3.2 hrs',
      topServices: ['Premium Oil Change', 'Brake System Flush'],
      topMechanics: ['Alex Turbo', 'Santi Gear'],
      fastestParts: ['Genuine Oil Filter', 'Brake Pads']
    },
    'Batino Branch': { 
      revenue: 98000, profit: 54000, volume: 92, efficiency: '2.8 hrs',
      topServices: ['Engine Detailing', 'Suspension Tuning'],
      topMechanics: ['Mike "Wrench" Torres'],
      fastestParts: ['Ceramic Brake Pads', 'Coolant']
    },
    'Third Branch': { 
      revenue: 115000, profit: 62000, volume: 110, efficiency: '4.1 hrs',
      topServices: ['Tire Alignment', 'A/C Cleaning'],
      topMechanics: ['John Doe'],
      fastestParts: ['Michelin Tires', 'Air Filter']
    }
  };

  const branches = Object.keys(branchData);
  const maxVal = Math.max(...branches.map(b => branchData[b][metric]));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. CHART & METRIC TOGGLE */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Enterprise Ranking</h2>
            <p className="text-sm text-slate-500">Comparing operational performance across locations.</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {['revenue', 'profit', 'volume'].map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${metric === m ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-500'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="flex items-end justify-around h-64 gap-4">
          {branches.map((branch) => {
            const val = branchData[branch][metric];
            const height = (val / maxVal) * 100;
            return (
              <div key={branch} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer" onClick={() => setSelectedBranch(branch)}>
                <div className="relative w-full flex justify-center items-end h-48">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className={`w-16 md:w-24 rounded-t-2xl transition-all duration-500 shadow-lg ${selectedBranch === branch ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-200 dark:bg-white/10 group-hover:bg-slate-300 dark:group-hover:bg-white/20'}`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {metric === 'volume' ? val : `₱${(val/1000).toFixed(1)}k`}
                    </div>
                  </motion.div>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedBranch === branch ? 'text-amber-500' : 'text-slate-400'}`}>
                  {branch}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. EFFICIENCY LEADERBOARD */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <Trophy className="text-amber-500" size={20} />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Efficiency Ranking</h3>
          </div>
          
          <div className="space-y-6">
            {branches.sort((a, b) => parseFloat(branchData[a].efficiency) - parseFloat(branchData[b].efficiency)).map((branch, i) => (
              <div key={branch} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-slate-200 dark:text-white/10">#{i+1}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{branch}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Turnover Time</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-500 flex items-center gap-1 justify-end">
                    <Clock size={14} /> {branchData[branch].efficiency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. DEEP DIVE (DRILL DOWN) */}
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 -translate-y-1/4 translate-x-1/4">
            <Zap size={300} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{selectedBranch} Deep-Dive</h3>
                <p className="text-slate-400 text-sm">Identifying the drivers of branch success.</p>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-400 border border-white/5">
                Active Insights
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Top Services */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-amber-500" /> Top Services
                </p>
                {branchData[selectedBranch].topServices.map(s => (
                  <div key={s} className="text-sm font-bold border-l-2 border-amber-500 pl-3 py-1">{s}</div>
                ))}
              </div>

              {/* Top Mechanics */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <UserCheck size={12} className="text-amber-500" /> Key Mechanics
                </p>
                {branchData[selectedBranch].topMechanics.map(m => (
                  <div key={m} className="text-sm font-bold border-l-2 border-blue-500 pl-3 py-1">{m}</div>
                ))}
              </div>

              {/* Inventory Speed */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <PackageSearch size={12} className="text-amber-500" /> Inventory Speed
                </p>
                {branchData[selectedBranch].fastestParts.map(p => (
                  <div key={p} className="text-sm font-bold border-l-2 border-emerald-500 pl-3 py-1">{p}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchRanking;