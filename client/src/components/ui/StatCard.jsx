import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-md dark:hover:border-white/20 group">
      <div className="flex justify-between items-start">
        
        {/* Text Container */}
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400 transition-colors">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 transition-colors">
            {value}
          </h3>
          
          {/* Optional Trend Indicator (e.g., "+12% this week") */}
          {trend && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1
              ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            `}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>

        {/* Icon Container */}
        <div className="h-12 w-12 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:border-overdrive-yellow dark:group-hover:border-overdrive-yellow transition-colors">
          {Icon && <Icon size={24} className="text-slate-400 dark:text-gray-400 group-hover:text-amber-500 dark:group-hover:text-overdrive-yellow transition-colors" />}
        </div>
        
      </div>
    </div>
  );
};

export default StatCard;