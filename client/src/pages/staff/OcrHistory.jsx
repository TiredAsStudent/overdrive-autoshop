import React, { useState } from 'react';
import { Search, Filter, Eye, Edit3, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';

const OcrHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data representing the lifecycle of OCR submissions
  const [submissions] = useState([
    { 
      id: 'REQ-9901', 
      date: '2026-04-10', 
      vendor: 'SM Auto Supply', 
      total: 4500.00, 
      status: 'Pending', 
      type: 'neutral',
      notes: 'Awaiting Admin verification.' 
    },
    { 
      id: 'REQ-9850', 
      date: '2026-04-08', 
      vendor: 'Petron Batino', 
      total: 1240.50, 
      status: 'Rejected', 
      type: 'error',
      notes: 'Receipt photo is too blurry. Please rescan with better lighting.' 
    },
    { 
      id: 'REQ-9822', 
      date: '2026-04-05', 
      vendor: 'Meralco', 
      total: 8900.00, 
      status: 'Approved', 
      type: 'success',
      notes: 'Verified. Utility expense posted to Batino Ledger.' 
    },
  ]);

  const filteredData = submissions.filter(s => 
    s.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Search and Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Vendor or Request ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 dark:text-white text-sm transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* The Transparency Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Request ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendor</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Admin Feedback</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {filteredData.map((sub) => (
              <tr key={sub.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5">
                  <span className="font-mono text-xs font-bold text-slate-400 group-hover:text-amber-500 transition-colors">{sub.id}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{sub.date}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.vendor}</p>
                </td>
                <td className="px-6 py-5 font-black text-slate-700 dark:text-gray-300 text-sm">
                  ₱{sub.total.toLocaleString()}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    {sub.status === 'Pending' && <Clock size={14} className="text-amber-500" />}
                    {sub.status === 'Approved' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {sub.status === 'Rejected' && <AlertCircle size={14} className="text-red-500" />}
                    <span className={`text-xs font-bold ${
                      sub.status === 'Approved' ? 'text-emerald-500' : 
                      sub.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 max-w-xs">
                  <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-gray-400 italic leading-relaxed">
                    <MessageSquare size={12} className="shrink-0 mt-0.5 opacity-40" />
                    {sub.notes}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  {sub.status === 'Rejected' ? (
                    <button className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                      <Edit3 size={16} />
                    </button>
                  ) : (
                    <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg hover:text-amber-500 transition-all">
                      <Eye size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OcrHistory;