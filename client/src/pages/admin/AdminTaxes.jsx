import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Landmark, Receipt, Scale, FileBadge, 
  ArrowUpRight, ArrowDownLeft, Info, 
  Settings, Download, Printer, ShieldCheck
} from 'lucide-react';

const AdminTaxes = () => {
  const [taxRate] = useState(0.12); // Hard-coded for PH context: 12%

  // 1. MOCK DATA: VAT Ledger Entries
  const [vatLogs] = useState([
    { id: 'TX-901', date: '2026-04-10', type: 'Output', source: 'INV-2026-005', amount: 3500, vat: 420 },
    { id: 'TX-902', date: '2026-04-09', type: 'Input', source: 'OCR-SUPPLY-88', amount: 12500, vat: 1500 },
    { id: 'TX-903', date: '2026-04-08', type: 'Output', source: 'INV-2026-004', amount: 8200, vat: 984 },
    { id: 'TX-904', date: '2026-04-07', type: 'Input', source: 'OCR-RENT-APR', amount: 40000, vat: 4800 },
  ]);

  const totalOutput = vatLogs.filter(l => l.type === 'Output').reduce((acc, curr) => acc + curr.vat, 0);
  const totalInput = vatLogs.filter(l => l.type === 'Input').reduce((acc, curr) => acc + curr.vat, 0);
  const netPayable = totalOutput - totalInput;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. TAX ENGINE STATUS HEADER */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Landmark size={120} />
        </div>
        <div className="flex items-center gap-6 z-10">
          <div className="h-16 w-16 bg-overdrive-yellow rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Compliance Engine</h2>
            <p className="text-slate-400 text-xs font-bold flex items-center gap-2">
              <Settings size={12} className="text-amber-500" /> Current Global Tax Rate: <span className="text-white">{(taxRate * 100)}% VAT (PH Standard)</span>
            </p>
          </div>
        </div>
        <button className="z-10 px-8 py-3 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
          <Download size={16} /> Export BIR Form 2550Q
        </button>
      </div>

      {/* 3. VAT KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Output VAT (Collected)</span>
            <ArrowUpRight className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">₱{totalOutput.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">From Customer Invoices</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Input VAT (Paid Out)</span>
            <ArrowDownLeft className="text-red-500" size={20} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">₱{totalInput.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">From Approved Supplier OCR</p>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow tracking-widest">Net VAT Payable</span>
            <Scale size={20} className="text-amber-500" />
          </div>
          <h3 className={`text-3xl font-black ${netPayable < 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
            {netPayable < 0 ? `(₱${Math.abs(netPayable).toLocaleString()})` : `₱${netPayable.toLocaleString()}`}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
            {netPayable < 0 ? 'Tax Credit Available' : 'Current Liability to BIR'}
          </p>
        </div>
      </div>

      {/* 4. VAT LEDGER TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Receipt size={16} /> Detailed VAT Transaction Ledger
            </h3>
            <button className="text-slate-400 hover:text-amber-500 transition-colors">
                <Printer size={18} />
            </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="px-8 py-5">Date & Transaction ID</th>
              <th className="px-8 py-5">Source Ref</th>
              <th className="px-8 py-5">Vatable Amount</th>
              <th className="px-8 py-5 text-right">VAT (12%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {vatLogs.map(log => (
              <tr key={log.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">{log.date}</p>
                  <p className="text-[10px] font-mono text-slate-400">{log.id}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${log.type === 'Output' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {log.type}
                    </span>
                    <p className="text-xs font-bold text-slate-600 dark:text-gray-300">{log.source}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-bold text-slate-500 dark:text-gray-400">₱{log.amount.toLocaleString()}</p>
                </td>
                <td className="px-8 py-6 text-right font-black text-slate-900 dark:text-white">
                  {log.type === 'Input' ? '-' : '+'} ₱{log.vat.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. TAX LOGIC FOOTER */}
      <div className="p-6 bg-amber-500 rounded-[32px] text-slate-900 flex items-start gap-4 relative overflow-hidden">
        <div className="p-3 bg-white/20 rounded-2xl">
          <Info size={24} />
        </div>
        <div>
          <h4 className="font-black uppercase text-sm tracking-tight italic">Audit Logic Notice</h4>
          <p className="text-xs font-bold opacity-80 mt-1 max-w-3xl leading-relaxed">
            The **Net VAT Payable** is calculated using the formula: $Net VAT Payable = Output VAT - Input VAT$. 
            This ledger pulls live data from the **OCR Intake Module** (Input) and the **Finalized Invoices** (Output). 
            Discrepancies must be settled before the quarterly deadline to avoid BIR penalties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminTaxes;