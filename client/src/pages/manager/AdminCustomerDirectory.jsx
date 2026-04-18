import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, Mail, 
  Car, ShieldCheck, ShieldAlert, 
  Send, MoreHorizontal, Edit3, 
  Archive, ChevronRight, UserCircle
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const AdminCustomerDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);

  // 1. MOCK DATA: Enterprise-wide Customer List
  const [customers] = useState([
    { 
      id: 'CUST-8801', 
      name: 'Jayro Agustin', 
      email: 'jayro@email.com', 
      phone: '0917-123-4567',
      status: 'Active', 
      vehicles: [
        { plate: 'ABC 1234', model: 'Toyota Hilux' },
        { plate: 'XYZ 9999', model: 'Honda Civic' }
      ],
      joinDate: '2025-11-15'
    },
    { 
      id: 'CUST-8805', 
      name: 'Santi Gear', 
      email: 'santi@garage.com', 
      phone: '0918-765-4321',
      status: 'Pending', 
      vehicles: [
        { plate: 'DEF 5678', model: 'Ford Ranger' }
      ],
      joinDate: '2026-02-10'
    }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. ADOPTION KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Database</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">1,450</h3>
            <span className="text-xs font-bold text-slate-400 pb-1">Owners Registered</span>
          </div>
        </div>
        <div className="bg-emerald-500 rounded-[32px] p-8 text-slate-900 shadow-lg shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-20"><ShieldCheck size={80} /></div>
          <p className="text-[10px] font-black uppercase text-slate-900/60 tracking-widest mb-2">Portal Adoption</p>
          <h3 className="text-4xl font-black italic">88%</h3>
          <p className="text-[10px] font-bold mt-2 uppercase">Active Digital Passports</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2">Pending Activation</p>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">12</h3>
            <button className="p-3 bg-amber-500 text-slate-900 rounded-2xl hover:scale-105 transition-all">
                <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & ACTIONS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Email, or License Plate..." 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm"
          />
        </div>
        <button className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all uppercase text-xs tracking-widest shadow-lg">
          <UserPlus size={18} /> Register New Customer
        </button>
      </div>

      {/* 4. CUSTOMER TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="px-8 py-5">Customer Profile</th>
              <th className="px-8 py-5">Digital Garage</th>
              <th className="px-8 py-5">Portal Security</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {customers.map(cust => (
              <tr key={cust.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-black/20 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      <UserCircle size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{cust.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{cust.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button 
                    onClick={() => setSelectedOwner(cust)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all"
                  >
                    <Car size={14} />
                    <span className="text-xs font-black">{cust.vehicles.length} Vehicles</span>
                    <ChevronRight size={12} />
                  </button>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-4">
                     <StatusBadge status={cust.status} type={cust.status === 'Active' ? 'success' : 'neutral'} />
                     {cust.status === 'Pending' && (
                       <button className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 hover:underline">
                         <Send size={12} /> Resend Invite
                       </button>
                     )}
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"><Edit3 size={18} /></button>
                    <button className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Archive size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. DIGITAL GARAGE MODAL (THE ONE-TO-MANY VIEW) */}
      <AnimatePresence>
        {selectedOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOwner(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Digital Garage</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Property of {selectedOwner.name}</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-2xl text-slate-900"><Car size={24} /></div>
                </div>

                <div className="space-y-3">
                  {selectedOwner.vehicles.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 group hover:border-amber-500 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500"><ShieldCheck size={20} /></div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{v.plate}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{v.model}</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black text-blue-500 uppercase hover:underline">View Medical Record</button>
                    </div>
                  ))}
                </div>

                <button onClick={() => setSelectedOwner(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">
                    Close Garage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCustomerDirectory;