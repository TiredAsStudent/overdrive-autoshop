import React from "react";

const variantStyles = {
  success:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  danger:
    "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
  warning:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  default:
    "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
};

const StatusBadge = ({
  label,
  variant = "default",
  icon: Icon,
  className = "",
}) => {
  const activeStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest border ${activeStyle} ${className}`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </span>
  );
};

export default StatusBadge;
