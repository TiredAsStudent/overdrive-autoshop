import React, { useState } from 'react';
import { Search, Phone, Mail, Car, Calendar, ExternalLink, User } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerDirectory = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data: Customers specifically linked to this branch
  const [customers] = useState([
    { 
      id: 'C-001', 
      name: 'Jay Agustin', 
      phone: '0917-123-4567', 
      email: 'jay.agustin@email.com',
      vehicles: ['ABC 1234 (Toyota Hilux)', 'XYZ 9999 (Honda Civic)'],
      lastVisit: '2026-03-15',
      branch: 'Batino Branch'
    },
    { 
      id: 'C-002', 
      name: 'Santi Gear', 
      phone: '0918-765-4321', 
      email: 'santi.gear@email.com',
      vehicles: ['DEF 4567 (Ford Ranger)'],
      lastVisit: '2026-04-01',
      branch: 'Batino Branch'
    },
  ]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.vehicles.some(v => v.includes(searchTerm.toUpperCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 1. SEARCH HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Plate Number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* 2. CUSTOMER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer) => (
            <motion.div 
              key={customer.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all group"
            >
              {/* Profile Header */}
              <div className="p-6 pb-4 border-b border-slate-50 dark:border-white/5 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{customer.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{customer.id}</p>
                  </div>
                </div>
                <button className="p-2 text-slate-300 hover:text-amber-500 transition-colors">
                  <ExternalLink size={18} />
                </button>
              </div>

              {/* Contact & History Details */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                    <Phone size={14} className="text-amber-500" /> {customer.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                    <Mail size={14} className="text-amber-500" /> {customer.email}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Registered Vehicles</p>
                  <div className="space-y-2">
                    {customer.vehicles.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-white/5 p-2 rounded-lg">
                        <Car size={14} className="text-slate-400" /> {v}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                    <Calendar size={12} /> Last Visit: {customer.lastVisit}
                  </div>
                  <StatusBadge status="Portal Active" type="success" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-black/10 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
          <User size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No customers found</h3>
          <p className="text-sm text-slate-500">Try searching for a different name, phone, or plate.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectory;