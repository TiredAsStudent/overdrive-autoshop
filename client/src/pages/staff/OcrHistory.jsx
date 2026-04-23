import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Eye,
  Edit3,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Files, // Replaced CopyAlert with Files to fix the Vite/Lucide error
  Bot,
  User as UserIcon,
} from "lucide-react";

const OcrHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock Data: Now includes Duplicate Flags and Method tracking
  const [submissions] = useState([
    {
      id: "REQ-9901",
      date: "2026-04-23",
      vendor: "SM Auto Supply",
      invoiceNo: "INV-88229",
      total: 4500.0,
      status: "Pending",
      type: "neutral",
      method: "AI",
      isDuplicate: false,
      notes: "Awaiting Checker verification. OCR confidence at 94%.",
    },
    {
      id: "REQ-9850",
      date: "2026-04-22",
      vendor: "Petron Batino",
      invoiceNo: "PET-5501",
      total: 1240.5,
      status: "Rejected",
      type: "error",
      method: "AI",
      isDuplicate: false,
      notes:
        "Total amount mismatch. The OCR read ₱1240.50 but the photo shows ₱1240.80.",
    },
    {
      id: "REQ-9825",
      date: "2026-04-21",
      vendor: "Shell Calamba",
      invoiceNo: "SH-00122",
      total: 3200.0,
      status: "Rejected",
      type: "error",
      method: "Manual",
      isDuplicate: true, // ANTI-DUPLICATE TRIGGERED
      notes:
        "Potential Duplicate: Vendor + Invoice # already exists in the March Ledger.",
    },
    {
      id: "REQ-9822",
      date: "2026-04-20",
      vendor: "Meralco",
      invoiceNo: "MER-99182",
      total: 8900.0,
      status: "Approved",
      type: "success",
      method: "AI",
      isDuplicate: false,
      notes: "Verified. Utility expense posted to Batino Branch Ledger.",
    },
  ]);

  const filteredData = submissions.filter(
    (s) =>
      s.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm) ||
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 1. SEARCH & FILTERS HEADER */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by Vendor, Invoice #, or Request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl outline-none focus:border-amber-500 dark:text-white font-bold text-sm transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5">
          <Filter size={16} /> Filter By Status
        </button>
      </div>

      {/* 2. THE TRANSPARENCY LOG TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Request ID & Date
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Vendor & Method
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Financials
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Manager Feedback
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <AnimatePresence>
                {filteredData.map((sub) => (
                  <motion.tr
                    key={sub.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* ID & DATE */}
                    <td className="px-8 py-6">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                        {sub.id}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        {sub.date}
                      </p>
                    </td>

                    {/* VENDOR & METHOD */}
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {sub.vendor}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {sub.method === "AI" ? (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                            <Bot size={10} /> AI Capture
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                            <UserIcon size={10} /> Manual
                          </span>
                        )}
                        {sub.isDuplicate && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded animate-pulse border border-red-200 dark:border-red-500/20">
                            <Files size={10} /> Duplicate SI#
                          </span>
                        )}
                      </div>
                    </td>

                    {/* TOTAL & INVOICE */}
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 dark:text-white text-lg tracking-tighter">
                        ₱{sub.total.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        SI: {sub.invoiceNo}
                      </p>
                    </td>

                    {/* STATUS */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            sub.status === "Approved"
                              ? "bg-emerald-500"
                              : sub.status === "Rejected"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          } shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
                        />
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            sub.status === "Approved"
                              ? "text-emerald-500"
                              : sub.status === "Rejected"
                                ? "text-red-500"
                                : "text-amber-500"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    </td>

                    {/* ADMIN FEEDBACK */}
                    <td className="px-8 py-6 max-w-xs">
                      <div
                        className={`p-3 rounded-xl text-[11px] font-medium leading-relaxed flex gap-2 ${
                          sub.status === "Rejected"
                            ? "bg-red-50 dark:bg-red-500/5 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/10"
                            : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <MessageSquare
                          size={14}
                          className="shrink-0 opacity-50 mt-0.5"
                        />
                        <p>{sub.notes}</p>
                      </div>
                    </td>

                    {/* ACTION BUTTON */}
                    <td className="px-8 py-6 text-right">
                      {sub.status === "Rejected" ? (
                        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all hover:scale-105 active:scale-95">
                          <Edit3 size={14} /> Fix & Resubmit
                        </button>
                      ) : (
                        <button className="p-3 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-xl hover:text-amber-500 dark:hover:text-amber-500 transition-all group">
                          <Eye
                            size={18}
                            className="group-hover:scale-110 transition-transform"
                          />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OcrHistory;
