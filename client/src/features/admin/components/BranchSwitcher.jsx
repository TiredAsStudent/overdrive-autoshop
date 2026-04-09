import React, { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BranchSwitcher = ({ currentBranch = 'All Branches', onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const branches = ['All Branches', 'Main Branch', 'Batino Branch', 'Third Branch'];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg hover:border-amber-400 dark:hover:border-overdrive-yellow transition-colors shadow-sm"
      >
        <Building2 size={16} className="text-amber-500 dark:text-overdrive-yellow" />
        <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{currentBranch}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50"
          >
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => { onSwitch(branch); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${currentBranch === branch ? 'bg-amber-50 dark:bg-overdrive-yellow/10 text-amber-700 dark:text-overdrive-yellow font-bold' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5'}
                `}
              >
                {branch}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchSwitcher;