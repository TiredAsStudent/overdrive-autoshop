import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Printer, 
  TrendingUp, TrendingDown, Eye, 
  Calendar, MapPin, Calculator,
  ArrowRight, Info, Zap
} from 'lucide-react';

const AdminReports = () => {
  const [basis, setBasis] = useState('cash'); // 'cash' | 'accrual'
  const [selectedBranch, setSelectedBranch] = useState('Consolidated');

  // 1. MOCK DATA: Statement Rows
  const reportData = {
    income: [
      { category: 'Service Income (Labor)', cash: 450000, accrual: 580000 }, // Accrual includes WIP
      { category: 'Parts Sales', cash: 820000, accrual: 950000 },
      { category: 'Membership Fees', cash: 25000, accrual: 25000 },
    ],
    expenses: [
      { category: 'Inventory Procurement', cash: 320000, accrual: 410000 }, // Accrual includes unpaid POs
      { category: 'Shop Rent & Utilities', cash: 165000, accrual: 165000 },
      { category: 'Mechanic Payouts', cash: 180000, accrual: 210000 },
      { category: 'Marketing', cash: 12000, accrual: 12000 },
    ]
  };

  const calculateTotals = (type) => {
    const totalIncome = reportData.income.reduce((sum, item) => sum + item[basis], 0);
    const totalExpense = reportData.expenses.reduce((sum, item) => sum + item[basis], 0);
    return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
  };

  const { totalIncome, totalExpense, netProfit } = calculateTotals();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. REPORT CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Financial Statements</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar size={12} /> FY 2026 • April 1st - April 30th
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Dual-Basis Toggle */}
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button 
              onClick={() => setBasis('cash')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${basis === 'cash' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-500'}`}
            >
              Cash Basis
            </button>
            <button 
              onClick={() => setBasis('accrual')}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${basis === 'accrual' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-500'}`}
            >
              Accrual Basis
            </button>
          </div>

          <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg">
            <Download size={16} /> Generate PDF Report
          </button>
        </div>
      </div>

      {/* 3. THE "SHEET": PROFIT & LOSS STATEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative">
        {/* Accrual Warning/Indicator */}
        <AnimatePresence>
          {basis === 'accrual' && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="bg-amber-500 text-slate-900 px-8 py-2 text-[10px] font-black uppercase text-center tracking-widest"
            >
              Viewing Accrual Basis (Including Projected Revenue & Unpaid Expenses)
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-12 space-y-12">
          {/* Income Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 border-b-2 border-slate-900 dark:border-white pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex-1">I. Total Income</h3>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div className="space-y-4">
              {reportData.income.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.category}</span>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">₱{item[basis].toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Total Gross Income</span>
                <span className="text-xl font-black text-emerald-500 italic underline decoration-double">₱{totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Expense Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 border-b-2 border-slate-900 dark:border-white pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex-1">II. Operating Expenses</h3>
              <TrendingDown className="text-red-500" size={20} />
            </div>
            <div className="space-y-4">
              {reportData.expenses.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.category}</span>
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">(₱{item[basis].toLocaleString()})</span>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Total Operating Expenses</span>
                <span className="text-xl font-black text-red-500 italic underline decoration-double">₱{totalExpense.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* FINAL CALCULATION: NET PROFIT */}
          <section className="bg-slate-900 dark:bg-black p-10 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 p-8 opacity-5">
              <Calculator size={150} color="white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">The Bottom Line</p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter">
                  Net Enterprise Profit
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-bold italic uppercase tracking-widest">Calculated across all active branches</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black text-white tracking-tighter">
                  ₱{netProfit.toLocaleString()}
                </p>
                <div className="flex items-center justify-end gap-2 text-emerald-500 font-black text-[10px] uppercase mt-2">
                  <Zap size={14} /> Margin: {((netProfit/totalIncome)*100).toFixed(1)}%
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 4. PDF METADATA FOOTER */}
      <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] text-slate-400 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <MapPin size={14} /> Branch: {selectedBranch}
        </div>
        <div>
          Authored by System • <span className="text-amber-500">Authenticated Enterprise Report</span>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;