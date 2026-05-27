import React from "react";
import { CheckCircle, AlertCircle, Info, TriangleAlert, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

// Upgraded to a clean, modern accent-based design
const TOAST_STYLES = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    indicator: "bg-emerald-500",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    indicator: "bg-rose-500",
  },
  warning: {
    icon: <TriangleAlert className="w-5 h-5 text-amber-500 shrink-0" />,
    indicator: "bg-amber-500",
  },
  info: {
    icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
    indicator: "bg-sky-500",
  },
};

const ToastItem = ({ id, message, type, duration = 4000 }) => {
  const { removeToast } = useApp();
  const currentStyle = TOAST_STYLES[type] || TOAST_STYLES.info;

  return (
    <div
      className="relative overflow-hidden flex items-start gap-3 w-full sm:w-96 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl dark:shadow-black/50 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-right-8 ease-out group"
      role="alert"
    >
      {/* Icon Accent */}
      <div className="pt-0.5">{currentStyle.icon}</div>

      {/* Message Content */}
      <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 leading-relaxed pt-1">
        {message}
      </div>

      {/* Dismiss Button - Appears slightly more prominent on hover */}
      <button
        type="button"
        onClick={() => removeToast(id)}
        className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 shrink-0 opacity-70 hover:opacity-100"
      >
        <X size={16} />
      </button>

      {/* Animated Auto-Dismiss Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${currentStyle.indicator} animate-shrink`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useApp();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[calc(100vw-48px)] sm:w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>
  );
};
