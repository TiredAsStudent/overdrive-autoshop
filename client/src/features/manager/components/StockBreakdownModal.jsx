import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Network,
  Loader2,
  Building2,
  AlertTriangle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { inventoryService } from "../../../services/manager/inventory.service";

const StockBreakdownModal = ({ isOpen, onClose, item }) => {
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (!isOpen || !item) return;
      try {
        setLoading(true);
        setError("");
        const response = await inventoryService.getBranchBreakdown(item.id);
        setBreakdown(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBreakdown();
  }, [isOpen, item]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case "In Stock":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> In Stock
          </span>
        );
      case "Low Stock":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest">
            <AlertTriangle size={12} /> Low Stock
          </span>
        );
      case "Out of Stock":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">
            <XCircle size={12} /> Out of Stock
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[32px] w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden max-h-[85vh]"
          >
            <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                  <Network className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[200px] sm:max-w-md">
                    {item?.item_name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    SKU: {item?.sku} • Cross-Branch Extraction
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Extracting Enterprise Data...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 font-medium text-sm">
                  {error}
                </div>
              ) : breakdown.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">
                    No active branches found for distribution.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {breakdown.map((branch) => (
                    <div
                      key={branch.branch_id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {branch.branch_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Code: {branch.branch_code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Physical Stock
                          </p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            {branch.quantity}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                        <div className="flex-1 text-right sm:text-left">
                          {getStatusDisplay(branch.stock_status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockBreakdownModal;
