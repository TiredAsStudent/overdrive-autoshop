import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, PieChart, 
  ArrowUpCircle, ArrowDownCircle, 
  Layers, MapPin, MoreHorizontal,
  ChevronRight, Calculator, Landmark
} from 'lucide-react';

const AdminAccounts = () => {
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  
  // 1. MOCK DATA: The Master Chart of Accounts (COA)
  const [accounts] = useState([
    { id: '1001', name: 'Service Income', type: 'Income', balance: 450000, main: 200000, second: 150000, third: 100000 },
    { id: '1002', name: 'Parts Sales', type: 'Income', balance: 820000, main: 400000, second: 220000, third: 200000 },
    { id: '5001', name: 'Inventory Procurement', type: 'Expense', balance: 320000, main: 150000, second: 90000, third: 80000 },
    { id: '5002', name: 'Shop Electricity', type: 'Expense', balance: 45000, main: 15000, second: 15000, third: 15000 },
    { id: '5003', name: 'Shop Rent', type: 'Expense', balance: 120000, main: 40000, second: 40000, third: 40000 },
    { id: '5004', name: 'Mechanic Labor Payout', type: 'Expense', balance: 180000, main: 80000, second: 50000, third: 50000 }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. TOP KPI CARDS: FINANCIAL PULSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-500 mb-4">
            <ArrowUpCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Gross Enterprise Income</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic">₱1,270,000.00</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <ArrowDownCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Operating Expenses</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic">₱665,000.00</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <PieChart size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <Calculator size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">Estimated Net Margin</span>
            </div>
            <h3 className="text-3xl font-black italic">₱605,000.00</h3>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNT MANAGEMENT CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {['All Branches', 'Main', 'Second', 'Third'].map(branch => (
            <button 
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${selectedBranch === branch ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-500'}`}
            >
              {branch}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search accounts..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs" />
          </div>
          <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      {/* 4. THE MASTER CHART OF ACCOUNTS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="px-8 py-5">Account Code & Name</th>
              <th className="px-8 py-5">Type</th>
              <th className="px-8 py-5 text-right">Enterprise Total</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {accounts.map(acc => (
              <tr key={acc.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${acc.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase">{acc.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">COA ID: {acc.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                    acc.type === 'Income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-red-50 text-red-600 dark:bg-red-500/10'
                  }`}>
                    {acc.type}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter italic">
                    ₱{acc.balance.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Running Balance</p>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex items-center justify-end gap-2 text-[10px] font-black text-amber-500 uppercase">
                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                     Source for Staff
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. MAKER-CHECKER INTEGRATION NOTE */}
      <div className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl">
            <Landmark size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm tracking-tight text-slate-900 dark:text-white italic">Governance Integration</h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mt-1">
              Changes to this list immediately update the "Category" dropdown for Staff in the OCR Intake module. This ensures every expense is pre-sorted before it reaches your approval queue.
            </p>
          </div>
        </div>
        <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400 hover:text-amber-500 transition-all">
          Download General Ledger
        </button>
      </div>
    </div>
  );
};

export default AdminAccounts;