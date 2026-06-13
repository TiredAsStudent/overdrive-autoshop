import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CircleAlert, Info } from "lucide-react";

const AlertDialog = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Understood",
  variant = "danger",
}) => {
  // Dynamic styling based on the variant
  const styles = {
    danger: {
      icon: (
        <CircleAlert size={28} className="text-red-600 dark:text-red-500" />
      ),
      bg: "bg-red-100 dark:bg-red-500/20",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: (
        <AlertTriangle
          size={28}
          className="text-amber-600 dark:text-amber-500"
        />
      ),
      bg: "bg-amber-100 dark:bg-amber-500/20",
      button: "bg-amber-500 hover:bg-amber-600 text-slate-900",
    },
    info: {
      icon: <Info size={28} className="text-blue-600 dark:text-blue-500" />,
      bg: "bg-blue-100 dark:bg-blue-500/20",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden text-center"
          >
            <div className="p-8">
              {/* Icon */}
              <div
                className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-6 ${currentStyle.bg}`}
              >
                {currentStyle.icon}
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase mb-3">
                {title}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={onClose}
                className={`w-full py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${currentStyle.button}`}
              >
                {buttonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AlertDialog;
