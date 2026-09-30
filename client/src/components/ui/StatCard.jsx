import React from "react";

const variantStyles = {
  default: {
    wrapper:
      "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    iconBox:
      "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
    title: "text-slate-500",
    value: "text-slate-900 dark:text-white",
  },
  success: {
    wrapper:
      "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20",
    iconBox:
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-600 dark:text-emerald-500",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    wrapper:
      "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20",
    iconBox:
      "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    title: "text-amber-600 dark:text-amber-500",
    value: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    wrapper:
      "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20",
    iconBox: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
    title: "text-rose-600 dark:text-rose-500",
    value: "text-rose-700 dark:text-rose-400",
  },
  info: {
    wrapper:
      "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20",
    iconBox: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    title: "text-blue-600 dark:text-blue-500",
    value: "text-blue-700 dark:text-blue-400",
  },
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
  className = "",
}) => {
  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`border rounded-[20px] sm:rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[110px] transition-colors ${styles.wrapper} ${className}`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-4">
        <span
          className={`text-[10px] sm:text-xs font-black uppercase tracking-widest truncate ${styles.title}`}
          title={title}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2 rounded-lg sm:rounded-xl shrink-0 ${styles.iconBox}`}
          >
            <Icon size={16} className="sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
      <span
        className={`text-2xl sm:text-3xl font-black font-mono tracking-tight truncate ${styles.value}`}
        title={typeof value === "string" ? value : ""}
      >
        {value}
      </span>
    </div>
  );
};

export default StatCard;
