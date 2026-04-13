import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, ShieldCheck, ShieldAlert, 
  MapPin, Mail, Clock, Lock, 
  Power, MoreVertical, Search, 
  Users, UserCheck, Key
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const AdminUserManagement = () => {
  const [isInviting, setIsInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. MOCK DATA: Employee Registry with RBAC & Branch Locks
  const [users, setUsers] = useState([
    { 
      id: 'USR-001', 
      name: 'Jayro Agustin', 
      email: 'admin@overdrive.com', 
      role: 'Admin (Global)', 
      branch: 'All Branches', 
      status: 'Active', 
      lastActive: '2 mins ago' 
    },
    { 
      id: 'USR-002', 
      name: 'Mike Torres', 
      email: 'mike.t@overdrive.com', 
      role: 'Staff', 
      branch: 'Batino Branch', 
      status: 'Active', 
      lastActive: '1 hour ago' 
    },
    { 
      id: 'USR-003', 
      name: 'Alex Turbo', 
      email: 'alex.v@overdrive.com', 
      role: 'Staff', 
      branch: 'Main Branch', 
      status: 'Pending', 
      lastActive: 'Never' 
    }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 2. SECURITY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute right-0 top-0 p-4 opacity-10"><ShieldCheck size={100} /></div>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Gatekeeper Status</p>
          <h3 className="text-3xl font-black italic">Closed-Loop</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Public Registration is Disabled</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Active Sessions</p>
          <div className="flex items-center gap-4">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">08</h3>
            <div className="flex -space-x-2">
              {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700" />)}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Pending Invites</p>
          <div className="flex items-center justify-between">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white italic">02</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase italic">Expiring in 2h</span>
          </div>
        </div>
      </div>

      {/* 3. USER TABLE CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Email, or Branch..." 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-amber-500 text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsInviting(true)}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all uppercase text-xs tracking-widest shadow-xl"
        >
          <UserPlus size={18} /> Send Security Invite
        </button>
      </div>

      {/* 4. THE USER REGISTRY TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="px-8 py-5">Employee Info</th>
              <th className="px-8 py-5">Role & RBAC</th>
              <th className="px-8 py-5">Branch Assignment</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-black/20 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <Key size={14} className={user.role.includes('Admin') ? 'text-amber-500' : 'text-blue-500'} />
                    <span className="text-xs font-black dark:text-gray-300">{user.role}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                    <MapPin size={12} /> {user.branch}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex items-center justify-end gap-4">
                     <div className="text-right">
                       <StatusBadge status={user.status} type={user.status === 'Active' ? 'success' : 'neutral'} />
                       <p className="text-[9px] text-slate-400 mt-1 font-bold">Seen {user.lastActive}</p>
                     </div>
                     <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400"><MoreVertical size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. INVITE MODAL (SECURITY DIALOG) */}
      <AnimatePresence>
        {isInviting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInviting(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Issue Invite</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 tracking-widest">Enforcing Closed-Loop Security</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-2xl text-slate-900"><Lock size={24} /></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Employee Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="email" placeholder="mechanic@overdrive.com" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold dark:text-white outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Role</label>
                      <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none">
                        <option>Staff</option>
                        <option>Admin (Global)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Branch Lock</label>
                      <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 text-sm font-bold dark:text-white outline-none focus:border-amber-500 appearance-none">
                        <option>Main Branch</option>
                        <option>Second Branch</option>
                        <option>Third Branch</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed italic">
                      Security Notice: This invitation will generate a unique link valid for only 2 hours.
                    </p>
                  </div>
                </div>

                <button onClick={() => setIsInviting(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">
                    <Send size={16} /> Send 2-Hour Security Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserManagement;