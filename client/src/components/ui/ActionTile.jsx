import React from 'react';
import { motion } from 'framer-motion';

const ActionTile = ({ title, description, icon: Icon, onClick }) => {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:border-amber-500 dark:hover:border-overdrive-yellow hover:shadow-md transition-colors text-left group"
    >
      <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-overdrive-yellow/10 flex items-center justify-center mb-4 transition-colors">
        {Icon && <Icon size={20} className="text-amber-600 dark:text-overdrive-yellow" />}
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 transition-colors">
        {description}
      </p>
    </motion.button>
  );
};

export default ActionTile;