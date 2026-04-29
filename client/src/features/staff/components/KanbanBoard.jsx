import React from 'react';
import KanbanCard from './KanbanCard';

const KanbanBoard = ({ jobs }) => {
  // Helper function to filter jobs by column
  const getJobsByStatus = (status) => jobs.filter(job => job.column === status);

  const columns = [
    { id: 'pending', title: 'Pending / Queue', color: 'bg-slate-100 dark:bg-black/20' },
    { id: 'ongoing', title: 'In Bay / Working', color: 'bg-amber-50 dark:bg-overdrive-yellow/5' },
    { id: 'done', title: 'Ready for Release', color: 'bg-emerald-50 dark:bg-emerald-500/5' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      {columns.map(col => (
        <div key={col.id} className={`flex flex-col rounded-2xl p-4 min-h-[60vh] border border-slate-200 dark:border-white/5 transition-colors ${col.color}`}>
          
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider text-sm transition-colors">
              {col.title}
            </h3>
            <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
              {getJobsByStatus(col.id).length}
            </span>
          </div>

          {/* Card Container */}
          <div className="flex flex-col gap-3">
            {getJobsByStatus(col.id).map(job => (
              <KanbanCard key={job.id} {...job} onClick={() => console.log('Clicked', job.plate)} />
            ))}
          </div>

        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;