import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, CreditCard, Receipt, 
  Database, Printer, CheckCircle2, 
  ArrowLeft, FileText, Camera 
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

const Invoices = ({ user }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'gcash' | 'bank'
  const [isFinalized, setIsFinalized] = useState(false);

  // Mock Data: Sales Orders ready for release (Status 'Done' in Kanban)
  const readyOrders = [
    { 
      id: 'SO-2026-001', 
      plate: 'ABC 1234', 
      customer: 'Jay Agustin', 
      total: 13650, 
      items: 3, 
      vat: 1462.50 
    }
  ];

  const handleFinalize = () => {
    // ATOMIC TRIGGER logic: 
    // 1. Inventory -= items
    // 2. Ledger += total
    // 3. Status = 'Archived'
    setIsFinalized(true);
  };

  if (isFinalized) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl mx-auto py-12 text-center space-y-6"
      >
        <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Transaction Complete</h2>
          <p className="text-slate-500">Inventory updated & Ledger synchronized.</p>
        </div>
        <div className="flex flex-col gap-3 pt-6">
          <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2">
            <Printer size={18} /> Print Physical Receipt
          </button>
          <button onClick={() => {setIsFinalized(false); setSelectedOrder(null);}} className="text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors">
            Return to Invoice List
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedOrder ? (
          <motion.div 
            key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Orders Awaiting Payment</h2>
            {readyOrders.map(order => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-overdrive-yellow/10 flex items-center justify-center text-amber-600 dark:text-overdrive-yellow">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{order.id}</h3>
                    <p className="text-xs text-slate-500">{order.customer} • {order.plate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900 dark:text-white">₱{order.total.toLocaleString()}</p>
                  <StatusBadge status="Ready for Release" type="success" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left: Summary */}
            <div className="space-y-6">
              <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to List
              </button>
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Final Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Invoice Amount</span>
                    <span>₱{selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">Includes 12% VAT: ₱{selectedOrder.vat.toLocaleString()}</p>
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-start gap-3">
                    <Database className="text-blue-500 shrink-0" size={16} />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Finalizing this will <strong>DEDUCT</strong> {selectedOrder.items} parts from the local inventory at <span className="text-amber-600 dark:text-overdrive-yellow font-bold">{user?.assigned_branch}</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Verification */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl">
              <h3 className="text-sm font-bold uppercase mb-6 opacity-60">Payment Verification</h3>
              
              <div className="flex gap-2 mb-8">
                {['cash', 'gcash', 'bank'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2
                      ${paymentMethod === method ? 'bg-white text-slate-900 border-white' : 'border-white/10 text-white/40 hover:border-white/30'}
                    `}
                  >
                    {method === 'cash' ? <Wallet size={14} /> : <CreditCard size={14} />}
                    {method}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                {paymentMethod === 'cash' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-40 mb-2 block">Amount Received</label>
                      <input type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-black outline-none focus:border-amber-500" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-40 mb-2 block">Reference Number</label>
                      <input type="text" placeholder="REF-XXXXXXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-amber-500 uppercase" />
                    </div>
                    <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white/50 hover:bg-white/5 transition-all">
                      <Camera size={18} /> Upload Screenshot
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleFinalize}
                  className="w-full py-5 bg-overdrive-yellow text-slate-900 font-black rounded-2xl text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                >
                  <FileText size={20} /> Post & Finalize
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;