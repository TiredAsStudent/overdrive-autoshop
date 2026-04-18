import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Wallet, Wrench, 
  ClipboardCheck, AlertOctagon, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

const AdminOverview = () => {
  // Mock Data: Aggregated totals from all 3 branches
  const stats = [
    { 
      label: 'Total Revenue', 
      value: '₱142,500.00', 
      trend: '+12.5%', 
      isPositive: true, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Net Profit', 
      value: '₱88,200.00', 
      trend: '+8.2%', 
      isPositive: true, 
      icon: Wallet, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Active Job Cards', 
      value: '24', 
      trend: '6 per branch', 
      isPositive: true, 
      icon: Wrench, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Pending Approvals', 
      value: '12', 
      trend: 'Needs Action', 
      isPositive: false, 
      icon: ClipboardCheck, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
    },
    { 
      label: 'Critical Stock', 
      value: '5 Items', 
      trend: 'Low Inventory', 
      isPositive: false, 
      icon: AlertOctagon, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Overview</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Real-time performance across all locations.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600 dark:text-gray-300 uppercase tracking-widest">Live System Feed</span>
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                <item.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
                item.isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'
              }`}>
                {item.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {item.trend}
              </div>
            </div>
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition-colors">
              {item.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* 3. PLACEHOLDER FOR NEXT SUB-TABS (Visual Balance) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="h-64 bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
          <p className="text-slate-400 font-bold text-sm italic">Branch-wise Revenue Chart Coming Soon...</p>
        </div>
        <div className="h-64 bg-slate-100/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
          <p className="text-slate-400 font-bold text-sm italic">Recent Global Activities Feed Coming Soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;