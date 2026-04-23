import React, { useState } from "react";
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
  Camera,
  AlertCircle,
  Smartphone,
  Banknote,
} from "lucide-react";

// ==========================================
// 1. MOCK DATA & CONSTANTS
// ==========================================
const MOCK_USER = { assigned_branch: "Batino Branch" };

const Invoices = ({ user = MOCK_USER }) => {
  // --- STATE ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' | 'gcash' | 'bank'
  const [isFinalized, setIsFinalized] = useState(false);
  const [generatedOR, setGeneratedOR] = useState("");

  // Payment Verification State
  const [cashReceived, setCashReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Mock Data: Sales Orders ready for release (Moved to 'Done' in Kanban)
  const [readyOrders, setReadyOrders] = useState([
    {
      id: "SO-2026-001",
      plate: "ABC 1234",
      customer: "Christian Leo Cereno",
      total: 13650,
      items: 4,
      vat: 1462.5,
      net: 12187.5,
    },
    {
      id: "SO-2026-003",
      plate: "GEE 3344",
      customer: "Juan Dela Cruz",
      total: 4500,
      items: 2,
      vat: 482.14,
      net: 4017.86,
    },
  ]);

  // --- DYNAMIC CALCULATIONS & VALIDATIONS ---
  const cashAmount = parseFloat(cashReceived) || 0;
  const changeAmount = selectedOrder ? cashAmount - selectedOrder.total : 0;

  const isPaymentValid = () => {
    if (!selectedOrder) return false;
    if (paymentMethod === "cash") return cashAmount >= selectedOrder.total;
    if (paymentMethod === "gcash" || paymentMethod === "bank")
      return referenceNumber.trim().length >= 6;
    return false;
  };

  // --- HANDLERS ---
  const handleFinalize = () => {
    if (!isPaymentValid()) return;

    // THE ATOMIC TRIGGER SIMULATION
    // 1. Generate Branch-Specific OR Number
    const branchCode = user.assigned_branch.split(" ")[0].toUpperCase();
    const newOR = `OR-2026-${Math.floor(Math.random() * 9000) + 1000}-${branchCode}`;
    setGeneratedOR(newOR);

    // 2. Remove from active list (Simulating Kanban Archive & Inventory Deduction)
    setReadyOrders(readyOrders.filter((o) => o.id !== selectedOrder.id));

    // 3. Show Success Screen
    setIsFinalized(true);
  };

  const resetFlow = () => {
    setIsFinalized(false);
    setSelectedOrder(null);
    setCashReceived("");
    setReferenceNumber("");
    setPaymentMethod("cash");
  };

  // ==========================================
  // RENDER: SUCCESS SCREEN
  // ==========================================
  if (isFinalized) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-in fade-in duration-500"
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

        {/* The Atomic Audit Trail (For Capstone Defense) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 text-left space-y-4 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 dark:border-white/5 pb-2">
            Atomic System Sync Complete
          </h3>

          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Database size={16} className="text-blue-500" />
            <span className="flex-1">
              Inventory officially deducted from {user.assigned_branch}
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <FileText size={16} className="text-amber-500" />
            <span className="flex-1">
              Revenue & 12% VAT posted to General Ledger
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Receipt size={16} className="text-purple-500" />
            <span className="flex-1">
              Job Card archived & removed from Workshop Kanban
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Smartphone size={16} className="text-emerald-500" />
            <span className="flex-1">
              E-Receipt pushed to Customer Digital Passport
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-transform">
            <Printer size={16} /> Print Physical OR
          </button>
          <button
            onClick={resetFlow}
            className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5"
          >
            <ArrowLeft size={16} /> Return to Invoice Queue
          </button>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // RENDER: MAIN FLOW
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6 animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {/* ========================================== */}
        {/* VIEW A: ORDERS AWAITING PAYMENT (QUEUE)    */}
        {/* ========================================== */}
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
                <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-bold">
                  Finalize payments to officially release vehicles at{" "}
                  <span className="text-amber-600 dark:text-overdrive-yellow font-black uppercase tracking-widest">
                    {user?.assigned_branch}
                  </span>
                  .
                </p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Ready for Release
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {readyOrders.length} Vehicles
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyOrders.length === 0 ? (
                <div className="md:col-span-2 p-12 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]">
                  <Receipt
                    size={48}
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                  />
                  <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Queue is Empty
                  </p>
                  <p className="text-sm font-bold text-slate-500 mt-1">
                    No vehicles are currently marked as 'Done' in the Workshop.
                  </p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-500 dark:hover:border-amber-500/50 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-black/20 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 dark:group-hover:bg-amber-500/10 dark:group-hover:text-amber-400 transition-colors">
                        <Receipt size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          {order.id}
                        </h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 mt-0.5">
                          {order.customer} •{" "}
                          <span className="text-amber-600 dark:text-amber-400">
                            {order.plate}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 pt-4 sm:pt-0 sm:pl-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                        Amount Due
                      </p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₱{order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================== */
          /* VIEW B: CHECKOUT & PAYMENT VERIFICATION    */
          /* ========================================== */
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* LEFT: Financial Summary */}
            <div className="space-y-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
              >
                <ArrowLeft size={16} /> Back to Queue
              </button>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 mb-3 inline-block">
                    Ready for Invoicing
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedOrder.id}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Plate:{" "}
                    <span className="text-slate-900 dark:text-white">
                      {selectedOrder.plate}
                    </span>
                  </p>
                </div>

                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                  Ledger Breakdown
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Net Sales (VAT Exclusive)</span>
                    <span>₱{selectedOrder.net.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>Value Added Tax (12%)</span>
                    <span>₱{selectedOrder.vat.toLocaleString()}</span>
                  </div>
                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Total Amount Due
                      </span>
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₱{selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Payment Verification UI */}
            <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Wallet size={150} />
              </div>

              <div className="relative z-10 flex-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-8 border-b border-white/10 pb-4">
                  Payment Verification
                </h3>

                {/* Method Selector */}
                <div className="flex gap-2 mb-10">
                  {["cash", "gcash", "bank"].map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        setCashReceived("");
                        setReferenceNumber("");
                      }}
                      className={`flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2
                        ${paymentMethod === method ? "bg-amber-500 text-slate-900 border-amber-500 shadow-lg shadow-amber-500/20" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}
                      `}
                    >
                      {method === "cash" && <Banknote size={20} />}
                      {method === "gcash" && <Smartphone size={20} />}
                      {method === "bank" && <CreditCard size={20} />}
                      {method}
                    </button>
                  ))}
                </div>

                {/* Dynamic Input based on Method */}
                <div className="space-y-6">
                  {paymentMethod === "cash" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                          Amount Tendered (Cash)
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
                      </div>

                      {/* Cash Change Calculator */}
                      <AnimatePresence>
                        {cashReceived !== "" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="overflow-hidden"
                          >
                            <div
                              className={`p-6 rounded-2xl border flex justify-between items-center ${changeAmount >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
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
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle
                          className="text-blue-400 shrink-0 mt-0.5"
                          size={16}
                        />
                        <p className="text-xs font-bold text-blue-200">
                          Digital payments require a Reference Number for the
                          Manager's end-of-day audit.
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                          Reference / Trace Number
                        </label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) =>
                            setReferenceNumber(e.target.value.toUpperCase())
                          }
                          placeholder="e.g. REF-123456789"
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-xl font-black outline-none focus:border-amber-500 transition-colors text-white uppercase tracking-wider"
                        />
                      </div>
                      <button className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                        <Camera size={18} /> Upload Screenshot Proof
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-8 mt-8 border-t border-white/10">
                <button
                  onClick={handleFinalize}
                  disabled={!isPaymentValid()}
                  className="w-full py-6 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/20"
                >
                  <FileText size={20} /> Post & Finalize Invoice
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
