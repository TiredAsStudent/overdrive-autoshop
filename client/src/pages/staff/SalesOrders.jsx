import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// REMOVED Tooltip and Save from the line below
import { Box, Info, Plus, ChevronRight } from 'lucide-react'; 
import StatusBadge from '../../components/ui/StatusBadge';



const SalesOrders = ({ user }) => {
  // Mock Data: Orders that were converted from Estimates
  const [orders, setOrders] = useState([
    { 
      id: 'SO-2026-001', 
      plate: 'ABC 1234', 
      customer: 'Jay Agustin',
      items: [
        { id: 'p1', name: 'Fully Synthetic Oil', qty: 4, status: 'reserved' },
        { id: 'p2', name: 'Genuine Oil Filter', qty: 1, status: 'reserved' }
      ],
      total: 5850,
      status: 'Ongoing' 
    },
    { 
      id: 'SO-2026-002', 
      plate: 'XYZ 9876', 
      customer: 'Santi Gear',
      items: [
        { id: 'p3', name: 'Brake Pads (Front)', qty: 1, status: 'reserved' }
      ],
      total: 3000,
      status: 'Ongoing' 
    }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Sales Orders (WIP)</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Resources committed to active repairs in <span className="text-amber-600 dark:text-overdrive-yellow font-bold">{user?.assigned_branch}</span>.
          </p>
        </div>
        
        {/* Admin Revenue Insight Badge */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-2 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Accrual Basis Visibility</p>
          <p className="text-lg font-black text-blue-800 dark:text-blue-300">₱8,850.00 <span className="text-xs font-normal opacity-70">Potential</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <motion.div 
            key={order.id}
            whileHover={{ x: 4 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors"
          >
            {/* Left: Info */}
            <div className="flex gap-6 items-center">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-black/20 flex items-center justify-center text-slate-400">
                <Box size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{order.id}</h3>
                  <span className="text-xs font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded">PLATE: {order.plate}</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">{order.customer}</p>
              </div>
            </div>

            {/* Middle: Reserved Parts (The Blue Status UI) */}
            <div className="flex-1 max-w-md">
              <p className="text-[10px] uppercase font-black text-slate-400 mb-2 flex items-center gap-1">
                Committed Stock <Info size={10} />
              </p>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold animate-pulse"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    {item.name} (x{item.qty})
                  </div>
                ))}
                <button className="h-7 w-7 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-white/10 text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-xs text-slate-400 font-bold uppercase">Open Order Total</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">₱{order.total.toLocaleString()}</p>
              </div>
              <button className="p-3 bg-slate-100 hover:bg-amber-500 dark:bg-white/5 dark:hover:bg-overdrive-yellow text-slate-400 hover:text-white dark:hover:text-slate-900 rounded-xl transition-all group">
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SalesOrders;