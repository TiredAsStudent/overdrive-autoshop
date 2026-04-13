import React from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

const KanbanCard = ({ job, mechanics = [], onMove, onAssign }) => {
  const { plate, vehicle, mechanic, status, column } = job;

  return (
    <motion.div
      layout
      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm group transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{plate}</h4>
        <StatusBadge status={status.text} type={status.type} />
      </div>
      
      <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-4">{vehicle}</p>

      {/* BRANCH-LOCKED MECHANIC ASSIGNMENT */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Mechanic</label>
        <div className="relative">
          <select 
            value={mechanic || ''}
            onChange={(e) => onAssign(job.id, e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-lg text-slate-700 dark:text-gray-300 outline-none focus:border-amber-500 appearance-none transition-all"
          >
            <option value="">Unassigned</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
          <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
        <span className="text-[10px] text-slate-400 italic">Updated just now</span>

        {column !== 'done' ? (
          <button 
            onClick={() => onMove(job.id)}
            disabled={!mechanic} // Cannot move to Ongoing without a mechanic!
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all
              ${mechanic 
                ? 'bg-amber-500 dark:bg-overdrive-yellow text-slate-900 hover:scale-105' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'}
            `}
          >
            {column === 'pending' ? 'Start Job' : 'Finish Job'} 
            <ArrowRight size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
            <CheckCircle2 size={14} /> Ready
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KanbanCard; // <--- ADD THIS LINE HERE