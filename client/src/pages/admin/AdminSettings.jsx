import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Percent, Landmark, MapPin, 
  Phone, Save, RefreshCw, Info, 
  ShieldCheck, Building2, Calculator
} from 'lucide-react';

const AdminSettings = () => {
  // 1. MOCK DATA: Global Variables & Branch Info
  const [markup, setMarkup] = useState(25);
  const [vat, setVat] = useState(12);
  
  const [branches, setBranches] = useState([
    { id: 1, name: 'Main Branch', address: '123 Overdrive Hway, Calamba, Laguna', phone: '049-555-0001' },
    { id: 2, name: 'Batino Branch', address: 'Bldg 4, Industrial Park, Batino, Calamba', phone: '049-555-0002' },
    { id: 3, name: 'Third Branch', address: 'Unit 12, SM City Calamba Annex, Laguna', phone: '049-555-0003' }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. THE BUSINESS LOGIC ENGINE (MARKUP & TAX) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-500 rounded-2xl text-slate-900">
                <Calculator size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Pricing & Tax Engine</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Logic Variables</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                  <Percent size={14} className="text-amber-500" /> Global Markup (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={markup} 
                    onChange={(e) => setMarkup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-2xl font-black dark:text-white outline-none focus:border-amber-500 transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Applied to all unit costs extracted via OCR.</p>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                  <Landmark size={14} className="text-blue-500" /> Value Added Tax (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={vat} 
                    onChange={(e) => setVat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 text-2xl font-black dark:text-white outline-none focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">Philippine Standard VAT (Default 12%).</p>
              </div>
            </div>

            {/* FORMULA DISPLAY */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-5"><RefreshCw size={100} /></div>
              <h4 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest">Active Calculation Logic</h4>
              <div className="text-sm font-mono leading-relaxed">
                {`$$Suggested\\ Retail = Unit\\ Cost \\times (1 + \\frac{${markup}}{100}) \\times (1 + \\frac{${vat}}{100})$$`}
              </div>
              <div className="mt-6 flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                <ShieldCheck size={14} className="text-emerald-500" /> Changes apply to all branches instantly
              </div>
            </div>
          </div>

          <button className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
            <Save size={18} /> Commit Global Changes
          </button>
        </div>

        {/* 3. BRANCH INFORMATION MANAGEMENT */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-500 rounded-2xl text-white">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Branch Identity</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Header Registry</p>
              </div>
            </div>

            <div className="space-y-6">
              {branches.map((branch) => (
                <div key={branch.id} className="p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-overdrive-yellow">{branch.name}</span>
                    <button className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-900 dark:hover:text-white transition-all">Edit</button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-xs text-slate-500 font-medium">
                      <MapPin size={14} className="shrink-0 mt-0.5" /> {branch.address}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <Phone size={14} className="shrink-0" /> {branch.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-3xl flex items-start gap-3">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
              <strong>Dynamic Injection:</strong> These contact details are automatically pulled to the header of all Estimates, Invoices, and Service Passports based on the logged-in staff's branch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;