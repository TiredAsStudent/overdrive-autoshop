import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";

/**
 * Reusable Confirmation Modal
 * @param {string} variant - "danger" (red), "warning" (amber), or "info" (blue)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // Dynamic styling based on the variant
  const styles = {
    danger: {
      icon: <Trash2 size={24} className="text-red-600 dark:text-red-500" />,
      bg: "bg-red-100 dark:bg-red-500/20",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: (
        <AlertTriangle
          size={24}
          className="text-amber-600 dark:text-amber-500"
        />
      ),
      bg: "bg-amber-100 dark:bg-amber-500/20",
      button: "bg-amber-500 hover:bg-amber-600 text-slate-900",
    },
    info: {
      icon: <Info size={24} className="text-blue-600 dark:text-blue-500" />,
      bg: "bg-blue-100 dark:bg-blue-500/20",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const currentStyle = styles[variant] || styles.info;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden text-center"
          >
            <div className="p-8">
              {/* Icon */}
              <div
                className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-6 ${currentStyle.bg}`}
              >
                {currentStyle.icon}
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase mb-2">
                {title}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex gap-3">
              <button
                onClick={onClose}
                disabled={isConfirming}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex justify-center items-center gap-2 ${currentStyle.button} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isConfirming && <Loader2 size={14} className="animate-spin" />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
