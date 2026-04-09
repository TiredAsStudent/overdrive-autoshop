import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, ClipboardList, Package } from 'lucide-react';

const TimelineItem = ({ date, title, description, type, mechanic, odometer }) => {
  // Map icons based on the type of service
  const icons = {
    service: <Wrench size={16} className="text-amber-500" />,
    checkin: <ClipboardList size={16} className="text-blue-500" />,
    parts: <Package size={16} className="text-purple-500" />,
    completed: <CheckCircle2 size={16} className="text-emerald-500" />,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative pl-8 pb-10 last:pb-0"
    >
      {/* Vertical Line Connector */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

      {/* Icon Bubble */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 flex items-center justify-center z-10 shadow-sm transition-colors">
        {icons[type] || icons.service}
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-amber-400 dark:hover:border-overdrive-yellow/50 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="text-xs font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-wider">
            {date}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded">
            ODO: {odometer} KM
          </span>
        </div>
        
        <h4 className="font-bold text-slate-900 dark:text-white mb-1 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed transition-colors">
          {description}
        </p>

        {mechanic && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
              {mechanic[0]}
            </div>
            <span className="text-xs text-slate-500 dark:text-gray-500">Handled by <span className="text-slate-700 dark:text-gray-300 font-medium">{mechanic}</span></span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ServiceTimeline = ({ history }) => {
  return (
    <div className="py-4">
      {history.map((item, index) => (
        <TimelineItem key={index} {...item} />
      ))}
    </div>
  );
};

export default ServiceTimeline;