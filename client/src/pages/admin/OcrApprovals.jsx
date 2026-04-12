import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Eye, AlertCircle, 
  TrendingUp, ArrowLeft, Save, Database, 
  Calculator, User, MapPin, Clock 
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const OcrApprovals = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [showMarkupAlert, setShowMarkupAlert] = useState(false);

  // Mock Data: Pending scans from the branches
  const [pendingRequests] = useState([
    { 
      id: 'REQ-OCR-9901', 
      branch: 'Batino Branch', 
      staff: 'Jay Agustin', 
      time: '2 hours ago', 
      confidence: 94, 
      total: 12500.00,
      image: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=1000',
      items: [
        { name: 'Fully Synthetic Oil', qty: 12, unitCost: 850, oldCost: 800 },
        { name: 'Genuine Oil Filter', qty: 5, unitCost: 450, oldCost: 450 }
      ]
    },
    { id: 'REQ-OCR-9905', branch: 'Main Branch', staff: 'Alex Turbo', time: '5 hours ago', confidence: 68, total: 820.00 }
  ]);

  const activeReq = pendingRequests.find(r => r.id === selectedId);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedId ? (
          /* 1. THE VERIFICATION LIST (SUMMARY VIEW) */
          <motion.div 
            key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">OCR Approval Queue</h2>
                <p className="text-sm text-slate-500">Verify branch expenses before they hit the financial ledger.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-black text-slate-400">
                    <th className="px-6 py-4 tracking-widest">Maker Info</th>
                    <th className="px-6 py-4 tracking-widest">Confidence</th>
                    <th className="px-6 py-4 tracking-widest">Total Amount</th>
                    <th className="px-6 py-4 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {pendingRequests.map(req => (
                    <tr key={req.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{req.staff}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                              <MapPin size={10} /> {req.branch} • <Clock size={10} /> {req.time}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-black mb-1">
                            <span className={req.confidence > 80 ? 'text-emerald-500' : 'text-amber-500'}>{req.confidence}% Match</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${req.confidence}%` }}
                              className={`h-full ${req.confidence > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">₱{req.total.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => setSelectedId(req.id)}
                          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 ml-auto hover:opacity-90 transition-opacity"
                        >
                          <Eye size={14} /> Review Scan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* 2. SIDE-BY-SIDE REVIEW UI (DETAIL VIEW) */
          <motion.div 
            key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-[calc(100vh-140px)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Queue
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                  <XCircle size={16} /> Reject Submission
                </button>
                <button 
                  onClick={() => setShowMarkupAlert(true)}
                  className="px-8 py-2.5 bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 size={16} /> Approve & Post
                </button>
              </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
              {/* Left Pane: Grease-Proof Receipt */}
              <div className="w-1/2 bg-slate-200 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden relative group">
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                  Enhanced Audit Evidence
                </div>
                <img 
                  src={activeReq.image} 
                  className="w-full h-full object-contain grayscale contrast-150 brightness-75 transition-all duration-700 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100" 
                  alt="Audit Trail"
                />
              </div>

              {/* Right Pane: Extracted Data Review */}
              <div className="w-1/2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 overflow-y-auto space-y-8 shadow-sm">
                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} /> Ledger Extraction
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor</label>
                      <input type="text" defaultValue="SM Auto Supply" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice #</label>
                      <input type="text" defaultValue="INV-88229" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm dark:text-white outline-none focus:border-amber-500" />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Line Item Audit</h3>
                  <div className="space-y-3">
                    {activeReq.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-500">Qty: {item.qty} units</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">₱{item.unitCost}</p>
                          {item.unitCost > item.oldCost && (
                            <span className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1 justify-end">
                              <TrendingUp size={10} /> +₱{item.unitCost - item.oldCost} Increase
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* The Markup Suggestion Alert (Action C) */}
                {showMarkupAlert && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-amber-500 rounded-2xl text-slate-900 space-y-4 shadow-xl shadow-amber-500/20"
                  >
                    <div className="flex items-start gap-3">
                      <Calculator size={24} className="shrink-0" />
                      <div>
                        <h4 className="font-black uppercase text-sm leading-tight">Markup Engine Warning</h4>
                        <p className="text-xs font-bold opacity-80 mt-1">
                          Unit costs for <span className="underline">Fully Synthetic Oil</span> have increased. Current retail price leaves only 15% margin.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">Adjust Retail Price</button>
                      <button onClick={() => setSelectedId(null)} className="flex-1 py-2 bg-white/20 border border-slate-900/10 rounded-lg text-[10px] font-black uppercase text-slate-900">Ignore & Post</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OcrApprovals;