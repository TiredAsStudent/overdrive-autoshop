import React, { useState } from 'react';
import { Save, X, Info, Tag } from 'lucide-react';

const OcrReviewer = ({ image, user, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    vendor: 'SM Auto Supply',
    date: '2026-04-10',
    invoiceNo: 'INV-88229',
    total: '4500.00',
    category: 'Inventory Parts'
  });

  return (
    <div className="flex flex-col lg:flex-row h-[80vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT PANE: Image Viewer with "Grease-Proof" Filter Simulation */}
      <div className="lg:w-1/2 bg-slate-100 dark:bg-black/40 relative group">
        <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
          Filtered Preview (Grayscale)
        </div>
        <img 
          src={image} 
          alt="Receipt" 
          className="w-full h-full object-contain grayscale contrast-125 brightness-90" 
        />
      </div>

      {/* RIGHT PANE: Editable Review Form */}
      <div className="lg:w-1/2 p-8 overflow-y-auto flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Review & Tag</h3>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mt-1">
              Branch ID: <span className="text-amber-500">{user?.assigned_branch || 'BATINO_01'}</span>
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Vendor / Supplier</label>
            <input 
              type="text" value={formData.vendor}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 dark:text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Total Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
              <input 
                type="text" value={formData.total}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-amber-500 dark:text-white font-bold"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Invoice / SI #</label>
            <input 
              type="text" value={formData.invoiceNo}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500 dark:text-white font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Expense Category (COA)</label>
            <div className="relative">
              <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-amber-500 dark:text-white font-bold appearance-none">
                <option>Inventory Parts</option>
                <option>Utilities (Water/Elec)</option>
                <option>Rent</option>
                <option>Shop Consumables</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-auto border-t border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-overdrive-yellow">
            <Info size={16} />
            <p className="text-xs font-bold">Please verify the SI Number matches the photo exactly.</p>
          </div>
          <button 
            onClick={onSubmit}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
          >
            <Save size={20} /> Submit for Admin Approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcrReviewer;