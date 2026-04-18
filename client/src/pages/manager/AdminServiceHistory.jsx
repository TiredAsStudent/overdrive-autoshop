import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, Download, Printer, 
  MapPin, User, Wrench, Package, 
  History, Calendar, CreditCard, ShieldCheck,
  ChevronRight, ExternalLink, Activity
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const AdminServiceHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFound, setVehicleFound] = useState(false);

  // 1. MOCK DATA: Unified Vehicle Medical Record
  const vehicleData = {
    plate: 'ABC 1234',
    model: 'Toyota Hilux 2021',
    owner: 'Jayro Agustin',
    lifetimeSpend: 125400.50,
    history: [
      { 
        id: 'JOB-901', 
        date: '2026-04-10', 
        branch: 'Main Branch', 
        mechanic: 'Alex Turbo',
        service: 'Engine Overhaul & Detailing',
        parts: ['OIL-FS-01 (x8)', 'FIL-TY-99'],
        status: 'Completed'
      },
      { 
        id: 'JOB-742', 
        date: '2025-11-20', 
        branch: 'Batino Branch', 
        mechanic: 'Mike Torres',
        service: 'Brake Pad Replacement',
        parts: ['BRK-CE-05 (Set)'],
        status: 'Completed'
      }
    ],
    invoices: [
      { id: 'INV-2026-005', date: '2026-04-10', amount: 45000 },
      { id: 'INV-2025-112', date: '2025-11-20', amount: 8500 }
    ]
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.toUpperCase() === 'ABC 1234') {
      setVehicleFound(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. PLATE-BASED SEARCH HEADER */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-5">
          <Activity size={200} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Unified Service History</h2>
            <p className="text-slate-400 text-sm font-medium">Access the "Medical Record" of any vehicle across the 3-branch enterprise.</p>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Enter License Plate (e.g. ABC 1234)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-14 pr-6 py-5 bg-white/10 border border-white/10 rounded-2xl focus:border-amber-500 outline-none font-black text-xl tracking-widest uppercase transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Press Enter to Query
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {vehicleFound ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* LEFT: MEDICAL CARD UI (TIMELINE) */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 dark:border-white/5 pb-6">
                  <History className="text-amber-500" size={20} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Repair Timeline</h3>
                </div>

                <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-white/5">
                  {vehicleData.history.map((job, idx) => (
                    <div key={idx} className="relative pl-12 group">
                      <div className="absolute left-0 top-1.5 h-10 w-10 bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-white/5 rounded-full flex items-center justify-center z-10 group-hover:border-amber-500 transition-all">
                        <Wrench size={16} className="text-slate-400 group-hover:text-amber-500" />
                      </div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">{job.service}</h4>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={job.branch} type="neutral" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.date}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><User size={12} /> Mechanic</p>
                          <p className="text-sm font-bold dark:text-gray-300">{job.mechanic}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Package size={12} /> Parts Log</p>
                          <div className="flex flex-wrap gap-2">
                            {job.parts.map((p, i) => (
                              <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-white/5 rounded-md border border-slate-200 dark:border-white/10">{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* INVOICE ARCHIVE */}
              <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 dark:border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Financial Archive</h3>
                </div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {vehicleData.invoices.map(inv => (
                      <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{inv.id}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{inv.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white text-right">
                          ₱{inv.amount.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all"><Printer size={16}/></button>
                            <button className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all"><Download size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: SUMMARY WIDGETS */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10"><ShieldCheck size={80} /></div>
                <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-4">Vehicle Identity</p>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">{vehicleData.plate}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1">{vehicleData.model}</p>
                
                <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Owner</span>
                    <span className="font-black underline decoration-amber-500 decoration-2 underline-offset-4">{vehicleData.owner}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Enterprise ID</span>
                    <span className="font-mono text-slate-300">#E-99221-A</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500 rounded-[32px] p-8 text-slate-900 shadow-xl shadow-amber-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Lifetime Investment</span>
                </div>
                <h3 className="text-4xl font-black italic tracking-tighter">₱{vehicleData.lifetimeSpend.toLocaleString()}</h3>
                <p className="text-[10px] font-bold opacity-80 mt-2 uppercase tracking-tight">Total Customer Value at Overdrive</p>
                
                <button className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={14} /> View Full Profile
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* EMPTY STATE */
          <div className="py-24 text-center space-y-4">
             <div className="h-20 w-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <History size={40} />
             </div>
             <p className="text-slate-500 font-bold text-sm">Enter a Plate Number above to access the Service Passport.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminServiceHistory;