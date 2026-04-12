import React, { useState } from 'react';
import AdjustmentForm from '../../features/staff/components/AdjustmentForm';
import TransferInbox from '../../features/staff/components/TransferInbox';
import { Plus, History } from 'lucide-react';

const MovementRequests = ({ user }) => {
  const [view, setView] = useState('inbox'); // 'inbox' | 'adjustment-form'
  
  // Mock Data for incoming transfers
  const [incoming] = useState([
    { id: 'TR-550', partName: 'Michelin Primacy 4', qty: 4, from: 'Main Branch', sentAt: 'Today, 10:15 AM' }
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Movements</h1>
          <p className="text-slate-500 text-sm mt-1">Receive deliveries or report local inventory loss.</p>
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-200 transition-all">
            <History size={14} /> View Audit Log
          </button>
          <button 
            onClick={() => setView('adjustment-form')}
            className="px-4 py-2 bg-amber-500 dark:bg-overdrive-yellow text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus size={14} /> Report Loss/Damage
          </button>
        </div>
      </div>

      <div className="mt-8">
        {view === 'inbox' ? (
          <TransferInbox 
            transfers={incoming} 
            onReceive={(id) => alert(`Atomic Update: Qty for Request ${id} added to ${user?.assigned_branch} stock.`)} 
          />
        ) : (
          <AdjustmentForm 
            onSubmit={() => { alert("Request Sent to Admin Approval Queue."); setView('inbox'); }}
            onCancel={() => setView('inbox')}
          />
        )}
      </div>
    </div>
  );
};

export default MovementRequests;