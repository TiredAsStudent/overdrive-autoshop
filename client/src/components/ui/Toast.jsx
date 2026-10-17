import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, TriangleAlert, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

const TOAST_STYLES = {
  success: {
    icon: (
      <CheckCircle
        aria-hidden="true"
        className="w-5 h-5 text-emerald-500 shrink-0"
      />
    ),
    indicator: "bg-emerald-500",
    border: "border-emerald-200/80 dark:border-emerald-500/20",
  },
  error: {
    icon: (
      <AlertCircle
        aria-hidden="true"
        className="w-5 h-5 text-rose-500 shrink-0"
      />
    ),
    indicator: "bg-rose-500",
    border: "border-rose-200/80 dark:border-rose-500/20",
  },
  danger: {
    icon: (
      <AlertCircle
        aria-hidden="true"
        className="w-5 h-5 text-rose-500 shrink-0"
      />
    ),
    indicator: "bg-rose-500",
    border: "border-rose-200/80 dark:border-rose-500/20",
  },
  warning: {
    icon: (
      <TriangleAlert
        aria-hidden="true"
        className="w-5 h-5 text-amber-500 shrink-0"
      />
    ),
    indicator: "bg-amber-500",
    border: "border-amber-200/80 dark:border-amber-500/20",
  },
  info: {
    icon: <Info aria-hidden="true" className="w-5 h-5 text-sky-500 shrink-0" />,
    indicator: "bg-sky-500",
    border: "border-slate-200 dark:border-slate-800",
  },
};

const ToastItem = ({ id, message, type = "info", duration = 4000 }) => {
  const { removeToast } = useApp();
  const shouldReduceMotion = useReducedMotion();
  const currentStyle = TOAST_STYLES[type] || TOAST_STYLES.info;

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={
        shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 24, scale: 0.96 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }
      }
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
      className={`relative overflow-hidden flex items-start gap-3 w-full sm:w-96 p-4 bg-white dark:bg-slate-900 border ${currentStyle.border} rounded-2xl shadow-2xl dark:shadow-black/50 group`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon Accent */}
      <div className="pt-0.5">{currentStyle.icon}</div>

      {/* Message Content */}
      <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5 break-words">
        {message}
      </div>

      {/* Accessible Dismiss Button */}
      <button
        type="button"
        onClick={() => removeToast(id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
      >
        <X size={16} aria-hidden="true" />
      </button>

      {/* Animated Auto-Dismiss Progress Bar */}
      {duration > 0 && (
        <div
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-1 ${currentStyle.indicator} animate-shrink`}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useApp();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-3 w-full max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
