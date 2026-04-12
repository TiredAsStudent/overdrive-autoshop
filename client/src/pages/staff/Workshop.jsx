import React, { useState } from 'react';
import WorkshopCheckIn from './WorkshopCheckIn';
import WorkshopKanban from './WorkshopKanban'; // Import the feature file

const Workshop = ({ user }) => {
  const [activeTab, setActiveTab] = useState('check-in');

  return (
    <div className="max-w-[1600px] mx-auto h-full flex flex-col space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Workshop Floor</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage intake and vehicle progress.</p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('check-in')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'check-in' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            1. Registration
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'kanban' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            2. Live Kanban
          </button>
        </div>
      </div>

      {/* RENDER CONTENT */}
      <div className="flex-1">
        {activeTab === 'check-in' ? (
          <WorkshopCheckIn />
        ) : (
          // PASS THE USER DOWN so WorkshopKanban knows which branch we are in
          <WorkshopKanban user={user} />
        )}
      </div>
    </div>
  );
};

export default Workshop;