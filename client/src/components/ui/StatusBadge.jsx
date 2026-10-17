import React from "react";

const variantStyles = {
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  danger:
    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  error:
    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  warning:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  default:
    "bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  neutral:
    "bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border-slate-200 dark:border-slate-600",
};

const StatusBadge = ({
  label,
  variant = "default",
  icon: Icon,
  className = "",
}) => {
  const normalizedVariant =
    typeof variant === "string" ? variant.toLowerCase() : "default";
  const activeStyle = variantStyles[normalizedVariant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${activeStyle} ${className}`}
    >
      {Icon && <Icon size={12} aria-hidden="true" className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
