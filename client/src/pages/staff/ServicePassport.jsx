import React, { useState } from 'react';
import { 
  Search, ShieldCheck, Printer, FileText, 
  Wrench, // <--- Change 'Tool' to 'Wrench' here
  Zap, Calendar, MapPin, ExternalLink 
} from 'lucide-react';
import ServiceTimeline from '../../components/shared/ServiceTimeline';
import StatusBadge from '../../components/ui/StatusBadge';

const ServicePassport = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('medical'); // 'medical' | 'invoices'

  // Mock Global Data (Simulating a search result from any branch)
  const [passportData] = useState({
    customer: 'Jay Agustin',
    plate: 'ABC 1234',
    model: 'Toyota Hilux 2021',
    odometer: '48,500 KM',
    // CROSS-BRANCH HISTORY
    history: [
      { 
        date: 'Apr 02, 2026', 
        title: 'Brake Pad Replacement', 
        branch: 'Batino Branch', 
        mechanic: 'Mike', 
        type: 'service',
        description: 'Installed Ceramic Brake Pads. Cleaned rotors.',
        parts: ['BRK-PD-02 (Ceramic Set)']
      },
      { 
        date: 'Jan 15, 2026', 
        title: 'Full Engine Detailing', 
        branch: 'Main Branch', 
        mechanic: 'Alex', 
        type: 'service',
        description: 'Steam cleaned engine bay. Applied protective coating.',
        parts: ['Consumables']
      },
      { 
        date: 'Nov 20, 2025', 
        title: '50k KM PMS (Early)', 
        branch: 'Third Branch', 
        mechanic: 'Santi', 
        type: 'parts',
        description: 'Oil change, filter replacement, spark plug check.',
        parts: ['OIL-FS-001 (x8)', 'FIL-G-99']
      }
    ],
    invoices: [
      { id: 'INV-2026-005', date: '2026-04-02', amount: 3500, status: 'Paid' },
      { id: 'INV-2026-001', date: '2026-01-15', amount: 1200, status: 'Paid' },
    ]
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 1. GLOBAL PASSPORT SEARCH */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4">
          <ShieldCheck size={200} />
        </div>
        
        <div className="z-10">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 uppercase">
            <ShieldCheck className="text-overdrive-yellow" /> Unified Service Passport
          </h2>
          <p className="text-slate-400 text-sm mt-1">Enterprise-wide medical record for all 3 branches.</p>
        </div>

        <div className="relative w-full md:w-96 z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Plate (e.g. ABC 1234)" 
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:border-overdrive-yellow outline-none transition-all text-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Vehicle/Customer Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <StatusBadge status="Enterprise Verified" type="success" />
            <h3 className="text-3xl font-black mt-4 text-slate-900 dark:text-white">{passportData.plate}</h3>
            <p className="text-slate-500 font-bold mb-6">{passportData.model}</p>
            
            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-slate-400">Owner</span>
                <span className="text-sm font-bold dark:text-white">{passportData.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-black text-slate-400">Current Odo</span>
                <span className="text-sm font-bold text-amber-600 dark:text-overdrive-yellow">{passportData.odometer}</span>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all">
              <ExternalLink size={14} /> View Full Profile
            </button>
          </div>
        </div>

        {/* RIGHT: Tabs & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit border border-slate-200 dark:border-white/10">
            <button 
              onClick={() => setActiveTab('medical')}
              className={`px-6 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'medical' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
            >
              Medical History
            </button>
            <button 
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-2 text-xs font-black uppercase rounded-lg transition-all ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
            >
              Invoice Archive
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm min-h-[500px]">
            {activeTab === 'medical' ? (
              <ServiceTimeline history={passportData.history} />
            ) : (
              <div className="space-y-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400">
                      <th className="pb-4">Invoice #</th>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Amount</th>
                      <th className="pb-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {passportData.invoices.map(inv => (
                      <tr key={inv.id} className="group">
                        <td className="py-4 text-sm font-bold text-slate-900 dark:text-white">{inv.id}</td>
                        <td className="py-4 text-xs text-slate-500">{inv.date}</td>
                        <td className="py-4 text-sm font-black dark:text-gray-200">₱{inv.amount.toLocaleString()}</td>
                        <td className="py-4 text-right">
                          <button className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all">
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePassport;