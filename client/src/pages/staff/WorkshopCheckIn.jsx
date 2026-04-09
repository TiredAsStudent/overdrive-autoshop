import React, { useState } from 'react';
import { Search, PlusCircle, Car, User, Gauge, History, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

// Shared UI components
import ServiceTimeline from '../../components/shared/ServiceTimeline';
import StatusBadge from '../../components/ui/StatusBadge';
import VehicleCheckInForm from '../../features/staff/components/VehicleCheckInForm';

const WorkshopCheckIn = () => {
  const { setSession } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('search'); // 'search' | 'passport' | 'register'
  const [foundVehicle, setFoundVehicle] = useState(null);

  // MOCK DATA: Simulate global search across 3 branches
  const mockDatabase = [
    { 
      plate: 'ABC 1234', 
      owner: 'Jay Agustin', 
      model: 'Toyota Hilux 2021', 
      lastVisit: 'Mar 15, 2026', 
      branch: 'Batino Branch',
      history: [
        { date: 'Mar 15, 2026', title: 'Periodic Maintenance', description: 'Oil change, filter replacement, and brake cleaning.', type: 'service', mechanic: 'Mike', odometer: '45,000' },
        { date: 'Jan 10, 2026', title: 'Suspension Check', description: 'Front shocks replaced at Main Branch.', type: 'parts', mechanic: 'Alex', odometer: '42,200' },
      ]
    }
  ];

  const handleSearch = (e) => {
  e.preventDefault();

  // 1. THE SAFETY GATE: If the search is empty, don't do anything!
  if (!searchQuery.trim()) {
    alert("Please enter a plate number first!");
    return;
  }

  const result = mockDatabase.find(v => v.plate === searchQuery.toUpperCase());
  
  if (result) {
    setFoundVehicle(result);
    setView('passport');
  } else {
    // Only shows registration if they actually typed something that wasn't found
    setView('register');
  }
};
  const startIntake = () => {
    setSession(foundVehicle.plate, { name: foundVehicle.owner });
    alert(`Intake started for ${foundVehicle.plate}. Moving to Workshop Floor...`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* 1. GLOBAL SEARCH HEADER */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Universal Plate Search</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Search the enterprise database (Main, Batino, Third) to retrieve a vehicle's Medical Record.</p>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ENTER PLATE NUMBER (e.g. ABC 1234)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-xl text-xl font-black tracking-widest text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <button type="submit" className="px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {/* 2. VIEW: SERVICE PASSPORT (Existing Customer) */}
        {view === 'passport' && foundVehicle && (
          <motion.div 
            key="passport" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: Vehicle Summary */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <StatusBadge status="Record Found" type="success" />
                <h3 className="text-3xl font-black mt-4 text-slate-900 dark:text-white tracking-tighter">{foundVehicle.plate}</h3>
                <p className="text-slate-500 font-bold">{foundVehicle.model}</p>
                
                <div className="mt-6 space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-overdrive-yellow/10 rounded-lg text-amber-600 dark:text-overdrive-yellow"><User size={18}/></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Owner</p>
                      <p className="text-sm font-bold dark:text-gray-200">{foundVehicle.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Gauge size={18}/></div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Last Odometer</p>
                      <p className="text-sm font-bold dark:text-gray-200">45,000 KM</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startIntake}
                  className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-600 dark:bg-overdrive-yellow dark:hover:bg-yellow-500 text-slate-900 font-black rounded-xl flex items-center justify-center gap-2 transition-all group"
                >
                  Confirm Intake for Today <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right: The Medical Record (Timeline) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 mb-8">
                <History className="text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Unified Service Passport</h3>
              </div>
              <ServiceTimeline history={foundVehicle.history} />
            </div>
          </motion.div>
        )}

        {/* 3. VIEW: REGISTRATION (New Customer) */}
        {view === 'register' && (
          <motion.div 
            key="register" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-overdrive-yellow/10 flex items-center justify-center text-amber-600 dark:text-overdrive-yellow">
                <PlusCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Vehicle Registration</h3>
                <p className="text-sm text-slate-500">Plate <span className="font-mono font-bold text-amber-600 dark:text-overdrive-yellow">{searchQuery}</span> was not found in our global records.</p>
              </div>
            </div>

            <VehicleCheckInForm onSubmit={() => alert("Registered & Intake complete!")} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default WorkshopCheckIn;