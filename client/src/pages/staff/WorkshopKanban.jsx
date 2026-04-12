import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KanbanCard from '../../features/staff/components/KanbanCard';
// 1. IMPORT the mechanics from your config
import { ALL_MECHANICS } from '../../config/constants'; 

const WorkshopKanban = ({ user }) => {
  // 2. FILTER mechanics by branch (Safety check: added optional chaining)
  const branchMechanics = ALL_MECHANICS?.filter(m => m.branch === user?.assigned_branch) || [];

  const [jobs, setJobs] = useState([
    { id: 1, plate: 'ABC 1234', vehicle: 'Toyota Hilux', mechanic: null, status: { text: 'Waiting', type: 'neutral' }, column: 'pending' },
    { id: 2, plate: 'XYZ 9876', vehicle: 'Honda Civic', mechanic: 'Mike "Wrench" Torres', status: { text: 'Repairs', type: 'warning' }, column: 'ongoing' },
  ]);

  const assignMechanic = (jobId, mechanicName) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, mechanic: mechanicName } : j));
  };

  const moveJob = (id) => {
    setJobs(prev => prev.map(job => {
      if (job.id === id) {
        if (job.column === 'pending') return { ...job, column: 'ongoing', status: { text: 'Ongoing', type: 'warning' } };
        if (job.column === 'ongoing') return { ...job, column: 'done', status: { text: 'Done', type: 'success' } };
      }
      return job;
    }));
  };

  const columns = [
    { id: 'pending', title: 'Pending' },
    { id: 'ongoing', title: 'Ongoing' },
    { id: 'done', title: 'Done' }
  ];

  console.log("DEBUG - User Object:", user);
console.log("DEBUG - User Branch:", user?.assigned_branch);
console.log("DEBUG - Total Mechanics in List:", ALL_MECHANICS?.length)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {columns.map(col => (
        <div key={col.id} className="bg-slate-100/50 dark:bg-black/10 p-4 rounded-2xl min-h-[70vh] border border-slate-200 dark:border-white/5">
          <h3 className="text-xs font-black uppercase text-slate-400 mb-4 px-2 tracking-widest">{col.title}</h3>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {jobs.filter(j => j.column === col.id).map(job => (
                <KanbanCard 
                  key={job.id} 
                  job={job} 
                  mechanics={branchMechanics} // <--- PASSING THE LIST TO THE CARD
                  onAssign={assignMechanic}
                  onMove={moveJob} 
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkshopKanban;