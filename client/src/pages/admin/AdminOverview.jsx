import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Download 
} from 'lucide-react';

// Import Admin Features
import RevenueChart from '../../features/admin/components/RevenueChart';
import BranchSwitcher from '../../features/admin/components/BranchSwitcher';

// Import shared UI
import StatCard from '../../components/ui/StatCard';

const AdminOverview = () => {
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Header with Branch Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Governance Overview</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Global performance metrics for <span className="font-bold text-amber-600 dark:text-overdrive-yellow">{selectedBranch}</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <Download size={16} /> Export Report
          </button>
          <BranchSwitcher currentBranch={selectedBranch} onSwitch={setSelectedBranch} />
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Global Revenue (MTD)" 
          value="₱1,240,500" 
          icon={TrendingUp} 
          trend="14% vs last month" 
          trendUp={true} 
        />
        <StatCard 
          title="Active Mechanics" 
          value="24" 
          icon={Users} 
        />
        <StatCard 
          title="Pending OCR Approvals" 
          value="7" 
          icon={AlertTriangle} 
          trend="Needs attention" 
          trendUp={false} 
        />
      </div>

      {/* Revenue Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        
        {/* Simple Sidebar Info for Admins */}
        <div className="bg-amber-500 dark:bg-overdrive-yellow p-6 rounded-xl flex flex-col justify-between text-slate-900 shadow-lg shadow-amber-500/20">
          <div>
            <h3 className="font-black uppercase tracking-widest text-xs opacity-70 mb-2">Branch Performance</h3>
            <p className="text-3xl font-black">Batino Branch</p>
            <p className="text-sm font-medium opacity-80 mt-1">Is currently outperforming Main Branch by 12% in parts turnover.</p>
          </div>
          <button className="mt-8 w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all">
            View Branch Details
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;