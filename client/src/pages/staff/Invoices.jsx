import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Receipt,
  Database,
  Printer,
  CheckCircle2,
  ArrowLeft,
  FileText,
  AlertCircle,
  Smartphone,
  Banknote,
  Loader2,
} from "lucide-react";
import staffBillingService from "../../services/staffBilling.service";

const Invoices = ({ user }) => {
  const [readyOrders, setReadyOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [generatedOR, setGeneratedOR] = useState("");

  const loadReadyOrders = async () => {
    setIsLoading(true);
    try {
      const data = await staffBillingService.getSalesOrders();
      setReadyOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReadyOrders();
  }, []);

  const cashAmount = parseFloat(cashReceived) || 0;
  const changeAmount = selectedOrder
    ? cashAmount - parseFloat(selectedOrder.total_amount)
    : 0;

  const isPaymentValid = () => {
    if (!selectedOrder) return false;
    if (paymentMethod === "CASH")
      return cashAmount >= parseFloat(selectedOrder.total_amount);
    if (paymentMethod === "GCASH" || paymentMethod === "BANK")
      return referenceNumber.trim().length >= 6;
    return false;
  };

  const handleFinalize = async () => {
    if (!isPaymentValid()) return;
    setIsFinalizing(true);
    setError(null);

    const paymentData = {
      method: paymentMethod,
      amount_tendered:
        paymentMethod === "CASH"
          ? cashAmount
          : parseFloat(selectedOrder.total_amount),
      reference: referenceNumber || null,
    };

    try {
      const result = await staffBillingService.finalizeInvoice(
        selectedOrder.id,
        paymentData,
      );
      setGeneratedOR(result.data?.invoiceRef || result.invoiceRef);
      setIsFinalized(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const resetFlow = () => {
    setIsFinalized(false);
    setSelectedOrder(null);
    setCashReceived("");
    setReferenceNumber("");
    setPaymentMethod("CASH");
    loadReadyOrders();
  };

  if (isFinalized) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in fade-in duration-500 px-4"
      >
        <div className="h-28 w-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 border-8 border-emerald-50 dark:border-emerald-500/20">
          <CheckCircle2 size={56} className="text-white" />
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Posted
          </h2>
          <p className="text-lg font-bold text-slate-500">
            Official Receipt:{" "}
            <span className="text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg ml-2">
              {generatedOR}
            </span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 text-left space-y-4 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 dark:border-white/5 pb-2">
            Atomic System Sync Complete
          </h3>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Database size={16} className="text-blue-500" />
            <span className="flex-1">Inventory officially deducted</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <FileText size={16} className="text-amber-500" />
            <span className="flex-1">Revenue posted to General Ledger</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-transform"
          >
            <Printer size={16} /> Print Physical OR
          </button>
          <button
            onClick={resetFlow}
            className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} /> Return to Queue
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6 animate-in fade-in duration-500 px-4">
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

      {!selectedOrder ? (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white transition-colors tracking-tight italic uppercase">
                Cashier & Invoicing
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-bold">
                Finalize payments to officially release vehicles.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm flex justify-between items-center cursor-pointer hover:border-emerald-400 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black dark:text-white">
                        {order.reference_number}
                      </h3>
                      <p className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-widest mt-1 inline-block">
                        {order.plate_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      ₱{parseFloat(order.total_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="checkout"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
              <h2 className="text-3xl font-black dark:text-white tracking-tight mb-6">
                {selectedOrder.reference_number}
              </h2>
              <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Amount Due
                </p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                  ₱{parseFloat(selectedOrder.total_amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Wallet size={150} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-8 border-b border-white/10 pb-4 relative z-10">
              Payment Verification
            </h3>

            <div className="flex gap-2 mb-8 relative z-10">
              {["CASH", "GCASH", "BANK"].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    setCashReceived("");
                    setReferenceNumber("");
                  }}
                  className={`flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 ${paymentMethod === method ? "bg-amber-500 text-slate-900 border-amber-500 shadow-lg" : "bg-white/5 border-white/10 text-white/50"}`}
                >
                  {method === "CASH" ? (
                    <Banknote size={20} />
                  ) : method === "GCASH" ? (
                    <Smartphone size={20} />
                  ) : (
                    <CreditCard size={20} />
                  )}{" "}
                  {method}
                </button>
              ))}
            </div>

            <div className="space-y-6 relative z-10 flex-1">
              {paymentMethod === "CASH" ? (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Amount Tendered
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-4xl font-black outline-none focus:border-amber-500 transition-colors text-white"
                    />
                  </div>
                  <AnimatePresence>
                    {cashReceived !== "" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                      >
                        <div
                          className={`mt-4 p-6 rounded-2xl border flex justify-between items-center ${changeAmount >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
                        >
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            Change Due
                          </span>
                          <span
                            className={`text-3xl font-black tracking-tighter ${changeAmount >= 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            ₱{Math.abs(changeAmount).toLocaleString()}
                            {changeAmount < 0 && (
                              <span className="text-[10px] uppercase ml-2 opacity-70 block text-right mt-1">
                                Insufficient
                              </span>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 mb-6">
                    <AlertCircle className="text-blue-400 shrink-0" size={16} />
                    <p className="text-xs font-bold text-blue-200">
                      Reference Number required for Audit.
                    </p>
                  </div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                    Reference Trace Number
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) =>
                      setReferenceNumber(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. REF-1234"
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-xl font-black outline-none focus:border-amber-500 transition-colors text-white uppercase"
                  />
                </div>
              )}
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 relative z-10">
              <button
                onClick={handleFinalize}
                disabled={!isPaymentValid() || isFinalizing}
                className="w-full py-6 bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-800 transition-all hover:scale-[1.02] shadow-xl shadow-emerald-500/20"
              >
                {isFinalizing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <FileText size={20} />
                )}{" "}
                Post & Finalize Invoice
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Invoices;
