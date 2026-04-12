import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, UserCheck, MapPin, 
  Award, Star, Mail, Phone, Settings,
  MoreVertical, Search, Filter, Power,
  ShieldAlert, Edit3
} from 'lucide-react';

const MechanicRegistry = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMech, setSelectedMech] = useState(null);

  // 1. MOCK DATA: Professional Profiles with Contact Info
  const [mechanics, setMechanics] = useState([
    { 
      id: 'MECH-001', 
      name: 'Mike "Wrench" Torres', 
      branch: 'Batino Branch', 
      branch_id: 2,
      specialty: 'Suspension & Alignment',
      phone: '0917-555-0123',
      email: 'mike.torres@overdrive.com',
      status: 'Active',
      rating: 4.9,
      jobsCompleted: 142
    },
    { 
      id: 'MECH-002', 
      name: 'Alex Turbo', 
      branch: 'Main Branch', 
      branch_id: 1,
      specialty: 'Engine Overhaul',
      phone: '0917-555-0987',
      email: 'alex.turbo@overdrive.com',
      status: 'On-Leave',
      rating: 4.8,
      jobsCompleted: 320
    }
  ]);

  const toggleStatus = (id) => {
    setMechanics(prev => prev.map(m => 
      m.id === id ? { ...m, status: m.status === 'Active' ? 'On-Leave' : 'Active' } : m
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 2. ADMIN CONTROL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Specialty, or Branch..." 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all uppercase text-xs tracking-widest shadow-lg">
          <UserPlus size={18} /> Register Professional
        </button>
      </div>

      {/* 3. PROFESSIONAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mechanics.map((mech) => (
          <motion.div 
            key={mech.id}
            layout
            className={`bg-white dark:bg-slate-800 rounded-3xl border ${mech.status === 'Active' ? 'border-slate-200 dark:border-white/10' : 'border-red-200 dark:border-red-900/30 opacity-75'} overflow-hidden shadow-sm hover:shadow-xl transition-all group`}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${mech.status === 'Active' ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-400'}`}>
                  <UserCheck size={32} />
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button 
                    onClick={() => toggleStatus(mech.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                      mech.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    <Power size={12} /> {mech.status}
                  </button>
                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                    <Star size={14} fill="currentColor" /> {mech.rating}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                  {mech.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Award size={14} className="text-blue-500" /> {mech.specialty}
                </div>
              </div>

              <div className="space-y-4 py-6 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg"><Phone size={14}/></div>
                  <span className="font-bold">{mech.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg"><Mail size={14}/></div>
                  <span className="font-bold lowercase">{mech.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg"><MapPin size={14}/></div>
                  <span className="font-bold text-amber-600 dark:text-overdrive-yellow uppercase">{mech.branch}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Edit3 size={14} /> Branch Transfer
                </button>
                <div className="px-4 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{mech.jobsCompleted}</p>
                   <p className="text-[8px] font-bold text-slate-500 uppercase">Jobs</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. ACCOUNTABILITY NOTE */}
      <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
          <strong>Security Protocol:</strong> Branch Assignments are branch-locked at the database level. Mechanics can only be assigned to Job Cards within their registered location to maintain 100% accurate labor costing and insurance compliance.
        </p>
      </div>
    </div>
  );
};

export default MechanicRegistry;