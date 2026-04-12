import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // Prevent scrolling on the background when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => document.body.style.overflow = 'unset';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-colors"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:text-gray-500 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto">
              {children}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;