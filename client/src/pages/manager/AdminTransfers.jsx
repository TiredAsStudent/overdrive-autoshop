import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightLeft,
  Truck,
  PackageCheck,
  Plus,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSignature,
} from "lucide-react";

const AdminTransfers = () => {
  const [activeTab, setActiveTab] = useState("pipeline"); // 'pipeline' | 'exceptions' | 'history'

  // 1. MOCK DATA: The Complete Transfer Protocol
  const [transfers] = useState([
    {
      id: "TRF-5502",
      part: "10W-40 Synthetic Oil (1L)",
      qty: 20,
      received: null,
      from: "Third Branch",
      to: "Main Branch",
      status: "In Transit",
      timestamp: "Today, 09:30 AM",
      requestedBy: "E. Garcia",
      assetValue: 17000,
    },
    {
      id: "TRF-5501",
      part: "Ceramic Brake Pads",
      qty: 15,
      received: null,
      from: "Second Branch",
      to: "Main Branch",
      status: "Pending Approval",
      timestamp: "2 hours ago",
      requestedBy: "L. Tan",
      assetValue: 6750,
    },
    {
      id: "TRF-5499",
      part: "Wiper Blades (20-inch)",
      qty: 10,
      received: 9, // Partial Receipt Trigger
      from: "Main Branch",
      to: "Third Branch",
      status: "Discrepancy",
      timestamp: "Yesterday, 04:45 PM",
      requestedBy: "J. Doe",
      assetValue: 4000,
      note: "1 unit damaged during transport.",
    },
    {
      id: "TRF-5490",
      part: "Genuine Oil Filter",
      qty: 8,
      received: 8,
      from: "Main Branch",
      to: "Second Branch",
      status: "Completed",
      timestamp: "Apr 21, 10:00 AM",
      requestedBy: "M. Torres",
      assetValue: 3600,
    },
  ]);

  const filteredTransfers = transfers.filter((tx) => {
    if (activeTab === "pipeline")
      return tx.status === "Pending Approval" || tx.status === "In Transit";
    if (activeTab === "exceptions") return tx.status === "Discrepancy";
    if (activeTab === "history") return tx.status === "Completed";
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 2. HEADER & ATOMIC LOGIC VISUAL (Your exact UI) */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            Internal Logistics
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 font-bold">
            Move assets between branches. The system uses Atomic Logic to ensure
            no part is ever lost in transit.
          </p>
        </div>

        <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg uppercase text-sm">
          <Plus size={20} /> Initiate New Transfer
        </button>
      </div>

      {/* 3. DYNAMIC PIPELINE VIEW */}
      <div className="space-y-6">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-white/10 shadow-sm">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "pipeline" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Active Pipeline
          </button>
          <button
            onClick={() => setActiveTab("exceptions")}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === "exceptions" ? "bg-white dark:bg-slate-700 text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Discrepancies{" "}
            {transfers.some((t) => t.status === "Discrepancy") && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "history" ? "bg-white dark:bg-slate-700 text-emerald-500 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Completed Logs
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTransfers.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 group transition-colors ${item.status === "Discrepancy" ? "border-red-200 dark:border-red-500/30" : "border-slate-200 dark:border-white/10"}`}
              >
                {/* Part & Direction */}
                <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                  <div
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                      item.status === "In Transit"
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : item.status === "Discrepancy"
                          ? "bg-red-50 text-red-500 dark:bg-red-500/20"
                          : item.status === "Completed"
                            ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/20"
                            : "bg-slate-100 dark:bg-white/5 text-slate-400"
                    }`}
                  >
                    {item.status === "Discrepancy" ? (
                      <AlertTriangle size={28} />
                    ) : item.status === "Completed" ? (
                      <CheckCircle2 size={28} />
                    ) : (
                      <Truck size={28} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {item.part}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {item.from}
                      </span>
                      <ArrowRightLeft size={12} className="text-blue-500" />
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {item.to}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={10} /> {item.timestamp} • {item.id}
                    </div>
                  </div>
                </div>

                {/* Dynamic Status Pipeline Visual */}
                <div className="flex items-center gap-4 flex-1 justify-center min-w-[250px]">
                  {/* Node 1: Request */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full ${item.status === "Pending Approval" ? "bg-amber-500 ring-4 ring-amber-500/20" : "bg-emerald-500"}`}
                    />
                    <span className="text-[8px] font-black uppercase text-slate-400">
                      Request
                    </span>
                  </div>
                  {/* Line 1 */}
                  <div
                    className={`h-1 w-12 rounded-full ${item.status !== "Pending Approval" ? "bg-emerald-500" : "bg-slate-100 dark:bg-white/5"}`}
                  />

                  {/* Node 2: Transit */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        item.status === "Pending Approval"
                          ? "bg-slate-100 dark:bg-white/5"
                          : item.status === "In Transit"
                            ? "bg-blue-500 ring-4 ring-blue-500/20"
                            : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-[8px] font-black uppercase text-slate-400">
                      Transit
                    </span>
                  </div>
                  {/* Line 2 */}
                  <div
                    className={`h-1 w-12 rounded-full ${item.status === "Completed" ? "bg-emerald-500" : item.status === "Discrepancy" ? "bg-red-500" : "bg-slate-100 dark:bg-white/5"}`}
                  />

                  {/* Node 3: Received */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        item.status === "Completed"
                          ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                          : item.status === "Discrepancy"
                            ? "bg-red-500 ring-4 ring-red-500/20"
                            : "bg-slate-100 dark:bg-white/5"
                      }`}
                    />
                    <span className="text-[8px] font-black uppercase text-slate-400">
                      Received
                    </span>
                  </div>
                </div>

                {/* Meta & Actions */}
                <div className="flex items-center justify-end gap-8 flex-1 min-w-[250px]">
                  {item.status === "Discrepancy" ? (
                    <div className="text-right border-r border-red-200 dark:border-red-500/30 pr-6">
                      <p className="text-lg font-black text-red-500">
                        {item.received} / {item.qty}
                      </p>
                      <p className="text-[9px] font-bold text-red-400 uppercase mt-1 max-w-[120px] leading-tight">
                        {item.note}
                      </p>
                    </div>
                  ) : (
                    <div className="text-right border-r border-slate-200 dark:border-white/10 pr-6">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        x{item.qty}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Total Units
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {item.status === "Pending Approval" && (
                      <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20">
                        Approve Move
                      </button>
                    )}
                    {item.status === "In Transit" && (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-xl">
                        <Truck size={14} className="animate-pulse" /> On Route
                      </div>
                    )}
                    {item.status === "Completed" && (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl">
                        <CheckCircle2 size={14} /> Secured
                      </div>
                    )}
                    {item.status === "Discrepancy" && (
                      <button className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2">
                        <FileSignature size={12} /> Audit Log
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTransfers.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-bold text-sm bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10">
              No transfers found in this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTransfers;
