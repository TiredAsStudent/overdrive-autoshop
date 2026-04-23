import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  History,
  AlertTriangle,
  Send,
  Truck,
  PackageCheck,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Info,
  Database,
} from "lucide-react";

// ==========================================
// MOCK DATA & CONSTANTS
// ==========================================
const MOCK_USER = { assigned_branch: "Batino Branch", id: "STAFF-9021" };

const INVENTORY_DB = [
  { id: "p1", name: "Fully Synthetic Oil (1L)", ocrUnitCost: 450 },
  { id: "p2", name: "Genuine Oil Filter", ocrUnitCost: 350 },
  { id: "p3", name: "Ceramic Brake Pads", ocrUnitCost: 1200 },
];

// ==========================================
// SUB-COMPONENT: ADJUSTMENT FORM (The Maker)
// ==========================================
const AdjustmentForm = ({ onSubmit, onCancel, user }) => {
  const [formData, setFormData] = useState({
    partId: "",
    qtyChange: -1,
    reason: "Spillage",
    notes: "",
  });

  const selectedPart = INVENTORY_DB.find((p) => p.id === formData.partId);
  const financialLoss = selectedPart
    ? Math.abs(formData.qtyChange) * selectedPart.ocrUnitCost
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-slate-200 dark:border-white/10 shadow-2xl max-w-2xl mx-auto relative overflow-hidden"
    >
      {/* Background Icon */}
      <div className="absolute -top-10 -right-10 text-slate-50 dark:text-slate-700/20 pointer-events-none">
        <AlertTriangle size={200} />
      </div>

      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 relative z-10"
      >
        <ArrowLeft size={14} /> Back to Inbox
      </button>

      <div className="flex items-start gap-4 mb-8 relative z-10">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Report Local Loss / Damage
          </h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Maker-Checker Protocol Enforced
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong className="uppercase">Zero-Edit Rule:</strong> You cannot
            modify stock quantities directly. Submitting this form creates a
            "Pending" request for the Manager. Inventory counts will{" "}
            <strong className="underline">not</strong> change until the Manager
            approves this request.
          </p>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
            1. Affected Asset
          </label>
          <select
            value={formData.partId}
            onChange={(e) =>
              setFormData({ ...formData, partId: e.target.value })
            }
            className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-black dark:text-white outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="">-- Select Asset from Database --</option>
            {INVENTORY_DB.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
              2. Qty Change
            </label>
            <input
              type="number"
              value={formData.qtyChange}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  qtyChange: parseInt(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-lg font-black text-red-500 outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
              3. Reason Code
            </label>
            <select
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-black dark:text-white outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
            >
              <option>Spillage / Leak</option>
              <option>Damaged during install</option>
              <option>Expired / Degraded</option>
              <option>Missing in Audit</option>
            </select>
          </div>
        </div>

        {/* Dynamic Financial Impact Display */}
        {selectedPart && (
          <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 text-slate-400">
              <Database size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Calculated Financial Loss
              </span>
            </div>
            <span className="text-xl font-black text-red-400 tracking-tighter">
              ₱{financialLoss.toLocaleString()}
            </span>
          </div>
        )}

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
            4. Mandatory Explanation
          </label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Describe exactly what happened to assist the Manager's investigation..."
            className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-bold dark:text-white outline-none focus:border-amber-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onSubmit}
            disabled={!formData.partId || !formData.notes}
            className="w-full py-5 bg-red-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95"
          >
            <Send size={18} /> Submit Formal Request
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ==========================================
// SUB-COMPONENT: TRANSFER INBOX
// ==========================================
const TransferInbox = ({ transfers, onReceive }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
          <Truck size={16} /> In-Transit Deliveries
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full">
          {transfers.length} Pending
        </span>
      </div>

      <AnimatePresence>
        {transfers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-slate-50 dark:bg-black/10 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5"
          >
            <PackageCheck
              size={48}
              className="mx-auto text-slate-300 dark:text-slate-700 mb-4"
            />
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Inbox Clear
            </p>
            <p className="text-sm font-bold text-slate-500 mt-1">
              No incoming inter-branch deliveries.
            </p>
          </motion.div>
        ) : (
          transfers.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 shadow-sm group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
            >
              <div className="flex gap-6 items-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 relative shrink-0">
                  <Truck size={28} />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-500 border-2 border-white dark:border-slate-800 rounded-full animate-ping" />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest text-slate-500">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> In-Transit
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {item.partName}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <MapPin size={12} className="text-slate-400" /> From:{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.from}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 xl:border-l border-slate-100 dark:border-white/5 xl:pl-8">
                <div className="text-center sm:text-right w-full sm:w-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Expected Qty
                  </p>
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                    {item.qty}
                  </p>
                </div>
                <button
                  onClick={() => onReceive(item.id)}
                  className="w-full sm:w-auto px-8 py-5 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <PackageCheck size={18} /> Verify & Receive
                </button>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT: STOCK REQUESTS HUB
// ==========================================
const MovementRequests = ({ user = MOCK_USER }) => {
  const [view, setView] = useState("inbox"); // 'inbox' | 'adjustment-form'

  // Mock Data for incoming transfers
  const [incoming, setIncoming] = useState([
    {
      id: "TR-550",
      partName: 'Michelin Primacy 4 (18")',
      qty: 4,
      from: "Biñan Main Branch",
      sentAt: "Today, 10:15 AM",
    },
    {
      id: "TR-552",
      partName: "Ceramic Brake Pads",
      qty: 12,
      from: "Cabuyao Branch",
      sentAt: "Yesterday, 4:30 PM",
    },
  ]);

  const handleReceive = (id) => {
    alert(
      `Atomic Security Logged: [${user.id}] has physically verified and received transfer ${id}. Local inventory has been updated.`,
    );
    setIncoming(incoming.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 py-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Stock Operations
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            Movement Command Center •{" "}
            <span className="text-amber-600 dark:text-overdrive-yellow">
              {user.assigned_branch}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button className="px-6 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-2xl text-[10px] flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5">
            <History size={16} /> Movement Log
          </button>
          <button
            onClick={() => setView("adjustment-form")}
            disabled={view === "adjustment-form"}
            className="px-6 py-4 bg-amber-500 text-slate-900 font-black uppercase tracking-widest rounded-2xl text-[10px] flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95"
          >
            <AlertTriangle size={16} /> Report Local Loss
          </button>
        </div>
      </div>

      <div className="pt-4">
        {view === "inbox" ? (
          <TransferInbox transfers={incoming} onReceive={handleReceive} />
        ) : (
          <AdjustmentForm
            user={user}
            onSubmit={() => {
              alert(
                "Adjustment Request securely logged. Pending Manager authorization.",
              );
              setView("inbox");
            }}
            onCancel={() => setView("inbox")}
          />
        )}
      </div>
    </div>
  );
};

export default MovementRequests;
