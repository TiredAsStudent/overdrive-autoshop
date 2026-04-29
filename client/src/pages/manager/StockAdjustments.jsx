import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowRight,
  History,
  ShieldAlert,
  Trash2,
  Camera,
  DollarSign,
} from "lucide-react";

const StockAdjustments = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // 1. Upgraded MOCK DATA: Now includes OCR Cost and Photo Evidence
  const [requests, setRequests] = useState([
    {
      id: "ADJ-102",
      branch: "Second Branch",
      staff: "Mike Torres",
      part: "Fully Synthetic Oil (1L)",
      qty: -2,
      ocrUnitCost: 850,
      reason: "Spillage/Leakage",
      notes: "Container cracked during delivery unloading.",
      time: "1 hour ago",
      photoUrl:
        "https://placehold.co/600x400/1e293b/ef4444?text=Evidence:+Cracked+Bottle",
    },
    {
      id: "ADJ-105",
      branch: "Main Branch",
      staff: "Santi Gear",
      part: "Brake Pads (Ceramic)",
      qty: -1,
      ocrUnitCost: 1250,
      reason: "Damaged during install",
      notes: "Clip snapped during high-pressure fitment.",
      time: "3 hours ago",
      photoUrl:
        "https://placehold.co/600x400/1e293b/ef4444?text=Evidence:+Snapped+Clip",
    },
  ]);

  // 2. Dynamic Calculation for the KPI
  const pendingValue = useMemo(() => {
    return requests.reduce(
      (acc, req) => acc + Math.abs(req.qty) * req.ocrUnitCost,
      0,
    );
  }, [requests]);

  // 3. Simple handler to simulate "Processing"
  const handleAction = (id) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
    setSelectedRequest(null);
    setIsRejecting(false);
    setRejectionNote("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* LOSS ANALYTICS (Your exact UI, upgraded with dynamic pending value) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle size={64} className="text-red-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Highest Loss Branch
          </p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl font-black text-red-500">Main Branch</h3>
            <span className="text-xs font-bold text-slate-400 pb-1">
              ₱12,400 this month
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <MessageSquare size={64} className="text-amber-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Common Reason
          </p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl font-black text-amber-500">
              Installation Damage
            </h3>
            <span className="text-xs font-bold text-slate-400 pb-1">
              42% of cases
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={64} className="text-blue-500" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
            Pending Exposure
          </p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl font-black text-blue-500">
              ₱
              {pendingValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </h3>
            <span className="text-xs font-bold text-slate-400 pb-1">
              Unapproved Loss
            </span>
          </div>
        </div>
      </div>

      {/* ADJUSTMENT REQUEST FEED (Your exact UI) */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={18} /> Manual Override
            Queue
          </h3>
          <button className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors">
            <History size={14} /> View Historical Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-transparent text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Request & Branch</th>
                <th className="px-6 py-4">Item & Quantity</th>
                <th className="px-6 py-4">Reason Code</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <AnimatePresence>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <motion.tr
                      key={req.id}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {req.id}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          {req.branch} • {req.staff}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <History size={10} /> {req.time}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {req.part}
                        </p>
                        <p
                          className={`text-xs font-black mt-1 ${req.qty < 0 ? "text-red-500" : "text-emerald-500"}`}
                        >
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
                          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase rounded-lg transition-transform hover:scale-105 flex items-center gap-2 ml-auto"
                        >
                          Review <ArrowRight size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-slate-500 font-bold text-sm"
                    >
                      <CheckCircle2
                        size={32}
                        className="mx-auto mb-3 opacity-50 text-emerald-500"
                      />
                      Queue is clear. No pending adjustments.
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DETAIL MODAL (Upgraded to max-w-4xl for Photo + OCR Valuation) */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedRequest(null);
                setIsRejecting(false);
                setRejectionNote("");
              }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-white/10"
            >
              {/* Left Column: Photo Evidence */}
              <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-800 p-8 flex flex-col">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                  <Camera size={16} className="text-blue-500" /> Uploaded
                  Evidence
                </h4>
                <div className="flex-1 bg-slate-200 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 overflow-hidden relative group min-h-[250px]">
                  <img
                    src={selectedRequest.photoUrl}
                    alt="Evidence"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {selectedRequest.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Verification & Action */}
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Verify Adjustment
                      </h3>
                      <p className="text-xs text-slate-500 uppercase font-bold mt-1">
                        {selectedRequest.branch} • {selectedRequest.staff}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <XCircle size={24} />
                    </button>
                  </div>

                  {/* OCR Financial Valuation Box */}
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-5 rounded-2xl mb-6">
                    <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-3 flex items-center gap-2">
                      <DollarSign size={14} /> Financial Exposure Valuation
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>Quantity Lost:</span>
                        <span className="text-red-500 font-black">
                          {Math.abs(selectedRequest.qty)} Units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>Historical Unit Cost:</span>
                        <span className="font-mono">
                          ₱{selectedRequest.ocrUnitCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-red-200 dark:border-red-500/20 flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                          Calculated Loss:
                        </span>
                        <span className="text-xl font-black text-red-500">
                          ₱
                          {(
                            Math.abs(selectedRequest.qty) *
                            selectedRequest.ocrUnitCost
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Notes */}
                  <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
                      Staff Explanation
                    </p>
                    <div className="flex items-start gap-3">
                      <MessageSquare
                        size={16}
                        className="text-amber-500 shrink-0 mt-1"
                      />
                      <p className="text-sm text-slate-600 dark:text-gray-300 italic leading-relaxed">
                        "{selectedRequest.notes}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons / Rejection Flow */}
                {isRejecting ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <label className="text-[10px] font-black uppercase text-red-500">
                      Rejection Reason (Mandatory)
                    </label>
                    <textarea
                      autoFocus
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="e.g. Photo evidence insufficient, please upload a clearer image..."
                      className="w-full bg-red-50/50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-sm outline-none focus:border-red-500 dark:text-white"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsRejecting(false)}
                        className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={rejectionNote.length < 5}
                        onClick={() => handleAction(selectedRequest.id)}
                        className="flex-2 py-3 bg-red-600 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-red-600/20 transition-all"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 py-4 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 transition-all text-xs uppercase"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleAction(selectedRequest.id)}
                      className="flex-2 py-4 bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={18} /> Approve Loss
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
