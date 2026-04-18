import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle2, XCircle, 
  MessageSquare, ArrowRight, 
  History, ShieldAlert, Trash2
} from 'lucide-react';

const StockAdjustments = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // 1. Changed to a state we can actually modify
  const [requests, setRequests] = useState([
    { 
      id: 'ADJ-102', 
      branch: 'Batino Branch', 
      staff: 'Mike Torres', 
      part: 'Fully Synthetic Oil (1L)', 
      qty: -2, 
      reason: 'Spillage/Leakage', 
      notes: 'Container cracked during delivery unloading.',
      time: '1 hour ago'
    },
    { 
      id: 'ADJ-105', 
      branch: 'Main Branch', 
      staff: 'Santi Gear', 
      part: 'Brake Pads (Ceramic)', 
      qty: -1, 
      reason: 'Damaged during install', 
      notes: 'Clip snapped during high-pressure fitment.',
      time: '3 hours ago'
    }
  ]);

  // 2. Simple handler to simulate "Processing"
  const handleAction = (id) => {
    setRequests(prev => prev.filter(req => req.id !== id));
    setSelectedRequest(null);
    setIsRejecting(false);
    setRejectionNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* LOSS ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Highest Loss Branch</p>
          <div className="flex items-end gap-2">
            <h3 className="text-xl font-black text-red-500">Main Branch</h3>
            <span className="text-xs font-bold text-slate-400 pb-1">₱12,400 this month</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Common Reason</p>
          <div className="flex items-end gap-2">
            <h3 className="text-xl font-black text-amber-500">Installation Damage</h3>
            <span className="text-xs font-bold text-slate-400 pb-1">42% of cases</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pending Value</p>
          <div className="flex items-end gap-2">
            <h3 className="text-xl font-black text-blue-500">₱2,850.00</h3>
            <span className="text-xs font-bold text-slate-400 pb-1">Unapproved</span>
          </div>
        </div>
      </div>

      {/* ADJUSTMENT REQUEST FEED */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={18} /> Manual Override Queue
          </h3>
          <button className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors">
            <History size={14} /> View Historical Logs
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-black/20 text-[10px] uppercase font-black text-slate-400">
              <th className="px-6 py-4">Request & Branch</th>
              <th className="px-6 py-4">Item & Quantity</th>
              <th className="px-6 py-4">Reason Code</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            <AnimatePresence>
              {requests.map(req => (
                <motion.tr 
                  key={req.id} 
                  exit={{ opacity: 0, x: -20 }}
                  className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{req.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{req.branch} • {req.staff}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{req.part}</p>
                    <p className={`text-xs font-black ${req.qty < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {req.qty} Units
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-200 dark:border-amber-500/20">
                      {req.reason}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-amber-500 rounded-lg transition-all"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verify Adjustment</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold mt-1">{selectedRequest.id} • {selectedRequest.branch}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                    <Trash2 size={24} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Staff Explanation</p>
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className="text-amber-500 shrink-0 mt-1" />
                    <p className="text-sm text-slate-600 dark:text-gray-300 italic leading-relaxed">
                      "{selectedRequest.notes}"
                    </p>
                  </div>
                </div>

                {isRejecting ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-red-500">Rejection Reason (Mandatory)</label>
                    <textarea 
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="e.g. Evidence insufficient..."
                      className="w-full bg-red-50/50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-sm outline-none focus:border-red-500 dark:text-white"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsRejecting(false)} className="flex-1 py-3 text-xs font-bold text-slate-400">Cancel</button>
                      <button 
                        onClick={() => handleAction(selectedRequest.id)}
                        className="flex-2 py-3 bg-red-600 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-red-600/20"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 py-4 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-red-500 transition-all text-xs uppercase"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(selectedRequest.id)}
                      className="flex-2 py-4 bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={18} /> Confirm Adjustment
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockAdjustments;