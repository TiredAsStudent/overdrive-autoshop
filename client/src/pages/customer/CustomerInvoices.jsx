import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, FileText, Download, 
  CreditCard, CheckCircle2, History,
  ExternalLink, Filter, ShieldCheck,
  Printer, Landmark
} from 'lucide-react';

const CustomerInvoices = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. MOCK DATA: Pulls from Step 3 (Finalized Invoices)
  const invoices = [
    { 
      id: 'INV-2026-005', 
      date: 'April 10, 2026', 
      amount: 14000.00, 
      status: 'Paid', 
      method: 'GCash', 
      ref: '992817263',
      branch: 'Batino Branch' 
    },
    { 
      id: 'INV-2025-112', 
      date: 'Nov 20, 2025', 
      amount: 8500.50, 
      status: 'Paid', 
      method: 'Bank Transfer', 
      ref: 'BPI-X-9901',
      branch: 'Main Branch' 
    },
    { 
      id: 'INV-2025-045', 
      date: 'June 15, 2025', 
      amount: 4200.00, 
      status: 'Paid', 
      method: 'Cash', 
      ref: 'OFFICIAL-RCT-102',
      branch: 'Biñan Branch' 
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* 2. SEARCH & FILTER HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Financial Archive</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Your Immutable Billing Ledger
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Invoice ID or Date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm transition-all dark:text-white"
          />
        </div>
      </div>

      {/* 3. THE IMMUTABLE LEDGER */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Invoice Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Payment Evidence</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Branch</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {invoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400 group-hover:text-amber-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{inv.id}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{inv.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                          <CheckCircle2 size={12} /> {inv.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600"> via </span>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">{inv.method}</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400">Ref: {inv.ref}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{inv.branch}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-base font-black text-slate-900 dark:text-white italic tracking-tighter">₱{inv.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all" title="Print Invoice">
                        <Printer size={16} />
                      </button>
                      <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all" title="Download Official PDF">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SYSTEM VERIFIED FOOTER */}
      <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-5">
          <ShieldCheck size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck size={24} />
              <h4 className="text-lg font-black italic uppercase tracking-tight">System Verified Invoices</h4>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl">
              All documents in this archive are <strong>Official Receipts</strong>. They are cryptographically linked to your vehicle's 
              Digital Passport and are identical to the records stored in our branch enterprise database. These are tax-ready and 
              accepted for insurance processing.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center gap-4 shrink-0">
             <Landmark className="text-white/40" size={32} />
             <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Total Investment</p>
                <p className="text-2xl font-black italic tracking-tighter">₱26,700.50</p>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CustomerInvoices;