import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";

const FilterModal = ({
  isOpen,
  onClose,
  onClear,
  title = "Advanced Filters",
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
                <Filter size={16} className="text-amber-500" /> {title}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">{children}</div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex gap-3">
              <button
                onClick={onClear}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
