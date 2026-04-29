import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

const VehicleCheckInForm = ({ onFinished }) => {
  const { setSession } = useApp();
  const [plate, setPlate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Save to Global State
    setSession(plate, { name: 'Jay Agustin', phone: '0917-XXX-XXXX' });
    
    // 2. Tell the parent modal to close
    onFinished();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">License Plate Number</label>
        <input 
          type="text" 
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="AAA 1111" 
          required
          className="w-full px-6 py-4 text-3xl font-black uppercase tracking-widest text-center bg-slate-100 dark:bg-black/20 border-2 border-slate-200 dark:border-white/10 rounded-xl focus:border-overdrive-yellow outline-none text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-2 transition-colors">Current Odometer (KM)</label>
          <input 
            type="number" 
            placeholder="e.g. 45000"
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-amber-400 dark:focus:border-overdrive-yellow outline-none transition-colors text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-2 transition-colors">Fuel Level</label>
          <select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-amber-400 dark:focus:border-overdrive-yellow outline-none transition-colors text-slate-900 dark:text-white appearance-none">
            <option>Full</option>
            <option>3/4 Tank</option>
            <option>1/2 Tank</option>
            <option>1/4 Tank</option>
            <option>Empty / Light On</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-2 transition-colors">Initial Observations / Customer Requests</label>
        <textarea 
          rows="4"
          placeholder="Customer states AC is blowing warm air..."
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-amber-400 dark:focus:border-overdrive-yellow outline-none transition-colors text-slate-900 dark:text-white resize-none"
        ></textarea>
      </div>

      <button type="submit" className="w-full py-4 bg-amber-500 dark:bg-overdrive-yellow text-slate-900 font-bold text-lg rounded-xl">
        Register Vehicle Intake
      </button>

    </form>
  );
};

export default VehicleCheckInForm;