import React from 'react';

const StatusBadge = ({ status, type = 'neutral' }) => {
  // Map types to Tailwind colors for both Light and Dark mode
  const colorMap = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300 dark:border-white/10'
  };

  const selectedStyle = colorMap[type] || colorMap.neutral;

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent transition-colors ${selectedStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;