import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Clock, 
  Info, ShieldCheck, HardDrive, 
  User, BellRing, PackageSearch
} from 'lucide-react';

const CustomerInstructions = () => {
  const [newComment, setNewComment] = useState('');
  
  // 1. MOCK DATA: The Transparency Log
  // This combines System Events (from Kanban) and Customer Comments
  const [logs] = useState([
    { 
      id: 1, 
      type: 'system', 
      time: '10:15 AM', 
      text: 'Vehicle moved to Bay 02 by Alex Turbo.', 
      icon: HardDrive 
    },
    { 
      id: 2, 
      type: 'customer', 
      time: '10:30 AM', 
      text: 'Please keep the old brake pads for my inspection later.', 
      icon: User 
    },
    { 
      id: 3, 
      type: 'system', 
      time: '11:00 AM', 
      text: 'Parts Reservation: Ceramic Brake Pads (Set) tagged to your vehicle.', 
      icon: PackageSearch 
    },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. TWO-WAY INSTRUCTION BOX (THE INPUT) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-slate-900 rounded-2xl text-white">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">The Loop</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Instructions for Team</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              Need to add a detail? Your notes here appear instantly on the technician's dashboard.
            </p>

            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="e.g., Check the tire pressure on the spare as well..."
              className="flex-1 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-amber-500 transition-all resize-none min-h-[200px]"
            />

            <button className="mt-6 w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <Send size={14} /> Send to Workshop
            </button>
          </div>
        </div>

        {/* 3. TRANSPARENCY LOG (THE FEED) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Transparency Log</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase">
                <BellRing size={12} className="animate-bounce" /> Live Updates
              </div>
            </div>

            <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative pl-14 group"
                  >
                    {/* Log Icon Marker */}
                    <div className={`absolute left-2 top-0 h-8 w-8 rounded-xl flex items-center justify-center z-10 border-2 border-white transition-all
                      ${log.type === 'system' ? 'bg-blue-50 text-blue-500' : 'bg-amber-500 text-slate-900'}
                    `}>
                      <log.icon size={14} />
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${log.type === 'system' ? 'text-slate-400' : 'text-amber-600'}`}>
                          {log.type === 'system' ? 'System Event' : 'Your Note'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-snug">
                        {log.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* SECURITY NOTE */}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[10px] text-emerald-700 font-bold leading-relaxed italic">
              All interactions in The Loop are timestamped and appended to your vehicle’s permanent Digital Service Passport for future reference.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerInstructions;