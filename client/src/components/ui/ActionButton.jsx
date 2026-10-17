import React from "react";
import { Plus, Loader2 } from "lucide-react";

const VARIANT_STYLES = {
  primary:
    "bg-amber-500 hover:bg-amber-600 text-slate-900 border border-transparent shadow-sm shadow-amber-500/20",
  secondary:
    "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 border border-transparent shadow-sm",
  outline:
    "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs",
  danger:
    "bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-sm shadow-red-600/20",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-transparent",
};

const SIZE_STYLES = {
  sm: "px-4 py-2 text-[9px] rounded-lg gap-1.5",
  md: "px-6 py-2.5 text-[10px] rounded-xl gap-2",
  lg: "px-7 py-3.5 text-xs rounded-xl gap-2.5",
};

const ActionButton = ({
  onClick,
  label,
  children,
  icon: Icon = Plus,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  className = "",
  title,
  ariaLabel,
}) => {
  const activeVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const activeSize = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isDisabled = disabled || loading;
  const content = label ?? children;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-label={
        ariaLabel || (typeof content === "string" ? content : undefined)
      }
      aria-busy={loading || undefined}
      className={`w-full sm:w-auto font-black uppercase tracking-widest flex items-center justify-center transition-all whitespace-nowrap cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 disabled:pointer-events-none ${activeVariant} ${activeSize} ${className}`}
    >
      {loading ? (
        <Loader2
          size={16}
          aria-hidden="true"
          className="animate-spin shrink-0"
        />
      ) : (
        Icon && <Icon size={16} aria-hidden="true" className="shrink-0" />
      )}
      {content && <span>{content}</span>}
    </button>
  );
};

export default ActionButton;
