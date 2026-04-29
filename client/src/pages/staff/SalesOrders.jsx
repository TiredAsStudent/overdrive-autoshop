import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  ChevronRight,
  FileCheck,
  XCircle,
  Database,
  AlertCircle,
  Receipt,
  Loader2,
} from "lucide-react";
import staffBillingService from "../../services/staffBilling.service";

const SalesOrders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await staffBillingService.getSalesOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this order? This will release reserved inventory back into available stock.",
      )
    )
      return;
    setIsCancelling(true);
    try {
      await staffBillingService.cancelOrder(id);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const accruedRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount),
    0,
  );

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 py-6 px-4">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase flex items-center gap-2 border border-red-200 mb-6"
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200 dark:border-blue-500/20">
            Active Commitments
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white transition-colors tracking-tight italic uppercase mt-2">
            Sales Orders (WIP)
          </h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Unbilled Accrual
            </p>
            <p className="text-2xl font-black text-white tracking-tighter">
              ₱{accruedRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]"
            >
              <Box
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />
              <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                No Active Orders
              </p>
            </motion.div>
          ) : (
            orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6"
              >
                <div className="flex gap-6 items-center w-full xl:w-auto">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Box size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      {order.reference_number}
                    </h3>
                    <p className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-widest mt-1 inline-block">
                      {order.plate_number}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Amount Due
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                    ₱{parseFloat(order.total_amount).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                >
                  Manage Order <ChevronRight size={14} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[40px] shadow-2xl border border-slate-200 dark:border-white/10 p-8 flex flex-col"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/10 pb-6 mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedOrder.reference_number}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 uppercase mt-1">
                    Customer: {selectedOrder.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <XCircle size={32} />
                </button>
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-black/20 p-6 rounded-2xl mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    WIP Exposure
                  </p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                    ₱{parseFloat(selectedOrder.total_amount).toLocaleString()}
                  </p>
                </div>
                <Database size={32} className="text-blue-500 opacity-20" />
              </div>
              <div className="flex justify-between gap-4 mt-auto">
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  disabled={isCancelling}
                  className="w-1/3 py-4 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}{" "}
                  Cancel & Release
                </button>
                <button
                  disabled
                  className="w-2/3 py-4 bg-slate-200 dark:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <FileCheck size={16} /> Finalize (Requires Workshop 'Done')
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesOrders;
