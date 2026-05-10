import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Download,
  Database,
  Lock,
  AlertTriangle,
  FileDigit,
  Building,
  ArrowLeft,
} from "lucide-react";

// --- MOCK DATA ENGINE ---
// Completed jobs waiting to be billed
const MOCK_READY_ORDERS = [
  {
    id: "JO-CAB-0042",
    plate: "NCO-1234",
    customer: "Juan Dela Cruz",
    completedAt: "2026-05-10T14:30:00",
    items: [
      {
        id: 1,
        type: "LABOR",
        code: "LBR-OIL",
        name: "Standard Change Oil",
        price: 500,
        qty: 1,
        unitCost: 0,
      },
      // Note the unitCost (Moving Average) vs price (Selling Price)
      {
        id: 2,
        type: "PART",
        code: "OIL-SYN-4L",
        name: "Full Synthetic Motor Oil",
        price: 1800,
        qty: 1,
        unitCost: 1200,
      },
    ],
    totals: { base: 2053.57, vat: 246.43, grand: 2300, cogs: 1200 }, // COGS is the unitCost * qty
  },
];

// Already billed jobs waiting for the customer to pay (Accounts Receivable)
const MOCK_UNPAID_INVOICES = [
  {
    id: "INV-CAB-0089",
    plate: "ABC-9999",
    customer: "Maria Clara",
    total: 4500,
    terms: "NET_7",
    dueDate: "2026-05-17",
    status: "UNPAID",
  },
];

const Invoices = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("DASHBOARD"); // DASHBOARD | GENERATOR | PROCESSING | SUCCESS
  const [readyOrders, setReadyOrders] = useState(MOCK_READY_ORDERS);
  const [unpaidInvoices, setUnpaidInvoices] = useState(MOCK_UNPAID_INVOICES);

  // Generator State
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentTerm, setPaymentTerm] = useState("COD");

  // Terminal Simulation State
  const [processingLogs, setProcessingLogs] = useState([]);

  // --- LOGIC HANDLERS ---
  const openGenerator = (order) => {
    setActiveOrder(order);
    setView("GENERATOR");
  };

  const cancelGenerator = () => {
    setActiveOrder(null);
    setPaymentTerm("COD");
    setView("DASHBOARD");
  };

  // The Atomic Transaction Simulator
  const handleFinalize = () => {
    setView("PROCESSING");
    setProcessingLogs(["Initiating secure database transaction..."]);

    const steps = [
      "Locking Sales Order JO-CAB-0042 to prevent edits...",
      "Generating static PDF Snapshot (INV-CAB-0090)...",
      `Crediting Labor Revenue: ₱${(500 / 1.12).toFixed(2)}...`, // Base labor
      `Crediting Parts Revenue: ₱${(1800 / 1.12).toFixed(2)}...`, // Base parts
      `Crediting Output VAT Payable: ₱${activeOrder.totals.vat.toFixed(2)}...`,
      `Debiting Accounts Receivable: ₱${activeOrder.totals.grand.toFixed(2)}...`,
      `Relieving Inventory Asset: ₱${activeOrder.totals.cogs.toFixed(2)}...`,
      `Debiting Cost of Goods Sold (COGS): ₱${activeOrder.totals.cogs.toFixed(2)}...`,
      "Verifying Debits = Credits (Balance Check: OK)...",
      "COMMIT Transaction Successful.",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProcessingLogs((prev) => [...prev, steps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setView("SUCCESS"), 1000);
      }
    }, 600); // Add a log every 600ms to simulate backend work
  };

  const handleFinish = () => {
    // Remove from Ready Queue and add to Unpaid Invoices
    setReadyOrders([]);
    setUnpaidInvoices((prev) => [
      {
        id: "INV-CAB-0090",
        plate: activeOrder.plate,
        customer: activeOrder.customer,
        total: activeOrder.totals.grand,
        terms: paymentTerm,
        dueDate: paymentTerm === "COD" ? "Due Now" : "2026-06-10",
        status: "UNPAID",
      },
      ...prev,
    ]);
    setActiveOrder(null);
    setPaymentTerm("COD");
    setProcessingLogs([]);
    setView("DASHBOARD");
  };

  // =================================================================================================
  // VIEW 1: DASHBOARD (Invoicing Queue & AR)
  // =================================================================================================
  if (view === "DASHBOARD") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              <FileDigit className="text-indigo-500" size={28} />
              Invoicing & Billing
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Calamba Branch • Financial Generation
            </p>
          </div>
        </div>

        {/* SECTION 1: READY FOR INVOICING (Completed Sales Orders) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" /> Ready to Bill
            (Completed WIP)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-emerald-50 dark:bg-emerald-500/5 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <CheckCircle size={64} className="text-emerald-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-md">
                      {order.id}
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> Done 2h ago
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-1">
                    {order.plate}
                  </h3>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-6">
                    {order.customer}
                  </p>

                  <div className="flex justify-between items-end border-t border-emerald-200 dark:border-emerald-500/20 pt-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Expected Bill
                      </p>
                      <p className="text-lg font-mono font-black text-slate-900 dark:text-white">
                        ₱{order.totals.grand.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openGenerator(order)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1"
                    >
                      Generate <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="col-span-full p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center flex flex-col items-center justify-center text-slate-400">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  Queue is Empty
                </p>
                <p className="text-xs mt-1">
                  No completed jobs waiting for invoices.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: OUTSTANDING ACCOUNTS RECEIVABLE */}
        <div className="space-y-4 pt-8">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Outstanding Invoices
            (Accounts Receivable)
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Invoice No.
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Customer & Plate
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Terms
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Total Amount
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {unpaidInvoices.map((inv, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-mono text-xs font-bold text-indigo-500">
                      {inv.id}
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase">
                        {inv.plate}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {inv.customer}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {inv.terms.replace("_", " ")}
                      </p>
                      <p className="text-[9px] text-amber-500 uppercase tracking-widest">
                        Due: {inv.dueDate}
                      </p>
                    </td>
                    <td className="p-4 text-right font-mono text-sm font-black text-slate-900 dark:text-white">
                      ₱{inv.total.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded text-[9px] font-black uppercase tracking-widest">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 2: INVOICE GENERATOR
  // =================================================================================================
  if (view === "GENERATOR") {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-in slide-in-from-right-4 duration-500">
        {/* HEADER */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="pl-4">
            <button
              onClick={cancelGenerator}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 mb-3 flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Back to Queue
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
              Invoice Builder
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
              <Lock size={12} /> Inheriting data from Sales Order:{" "}
              <span className="font-mono text-indigo-500">
                {activeOrder.id}
              </span>
            </p>
          </div>
          <div className="w-full md:w-auto p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed max-w-[200px]">
              Item descriptions and prices are locked to preserve the audit
              trail. If changes are needed, you must modify the WIP Sales Order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: INHERITED DATA (Read-Only) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">
                    Customer Name
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase mt-1">
                    {activeOrder.customer}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">
                    Target Vehicle
                  </p>
                  <p className="text-sm font-mono font-black text-slate-900 dark:text-white mt-1">
                    {activeOrder.plate}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                Approved Line Items
              </h3>
              <div className="space-y-3">
                {activeOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 opacity-80 cursor-not-allowed"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                        {item.name}
                      </p>
                      <p className="text-[9px] font-mono text-slate-500 mt-1">
                        {item.qty} x ₱{item.price}
                      </p>
                    </div>
                    <p className="text-xs font-mono font-black text-slate-900 dark:text-white">
                      ₱{(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: FINANCIALS & ACTIONS */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Database size={14} /> Accounting Setup
              </h3>

              {/* Payment Terms */}
              <div className="mb-6 pb-6 border-b border-slate-800">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                  Payment Terms
                </label>
                <select
                  className="w-full outline-none text-xs font-black uppercase tracking-widest px-4 py-4 rounded-xl border-2 border-indigo-500/50 bg-indigo-500/10 text-indigo-400 cursor-pointer transition-all"
                  value={paymentTerm}
                  onChange={(e) => setPaymentTerm(e.target.value)}
                >
                  <option value="COD">Cash / Paid Immediately (COD)</option>
                  <option value="NET_7">Corporate Account: Net 7 Days</option>
                  <option value="NET_30">Corporate Account: Net 30 Days</option>
                </select>
                <p className="text-[9px] text-slate-500 mt-2 ml-1">
                  Determines aging in Accounts Receivable.
                </p>
              </div>

              {/* Secret COGS Validator (For Accounting Staff Eyes Only) */}
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> Profit
                  Margin Validation
                </p>
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>Inventory Cost (COGS)</span>
                  <span className="font-mono text-rose-400">
                    -₱{activeOrder.totals.cogs.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-1 border-t border-slate-700 pt-1">
                  <span>Est. Gross Profit</span>
                  <span className="font-mono text-emerald-400">
                    +₱
                    {(
                      activeOrder.totals.grand - activeOrder.totals.cogs
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 font-mono">
                <div className="flex justify-between text-slate-400 text-xs font-bold">
                  <span>LABOR + PARTS BASE</span>
                  <span>
                    ₱
                    {activeOrder.totals.base.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-indigo-400 text-xs font-black italic">
                  <span>OUTPUT VAT (12%)</span>
                  <span>
                    ₱
                    {activeOrder.totals.vat.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-4 mt-2 border-t border-slate-800">
                  <span className="text-[10px] font-black text-slate-500 uppercase font-sans">
                    Final Invoice Total
                  </span>
                  <span className="text-3xl font-black text-white italic">
                    ₱
                    {activeOrder.totals.grand.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleFinalize}
                className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex justify-center items-center gap-2"
              >
                Finalize & Post to General Ledger <ArrowRight size={16} />
              </button>
              <p className="text-center text-[9px] text-slate-500 font-bold uppercase mt-3">
                This action is permanent and creates double-entry records.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 3: PROCESSING TERMINAL (Simulating Atomic SQL Transaction)
  // =================================================================================================
  if (view === "PROCESSING") {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 rounded-3xl border border-slate-700 p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 overflow-hidden">
            <div
              className="h-full bg-emerald-500 w-1/2 animate-[ping-pong_1s_ease-in-out_infinite] translate-x-[-100%]"
              style={{ animation: "slide 1.5s infinite" }}
            ></div>
          </div>
          <style>{`@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>

          <h3 className="text-sm font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
            <Database
              className="text-indigo-400"
              size={18}
              animate-pulse="true"
            />
            Executing Atomic Transaction
          </h3>

          <div className="space-y-3 font-mono text-[10px] sm:text-xs">
            {processingLogs.map((log, index) => (
              <div
                key={index}
                className="flex gap-3 text-slate-300 animate-in slide-in-from-bottom-2"
              >
                <span className="text-emerald-500">
                  [{new Date().toLocaleTimeString()}]
                </span>
                <span>{log}</span>
              </div>
            ))}
            <div className="flex gap-3 text-indigo-400 animate-pulse">
              <span>[{new Date().toLocaleTimeString()}]</span>
              <span>...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 4: SUCCESS & PDF SNAPSHOT
  // =================================================================================================
  if (view === "SUCCESS") {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-500" size={48} />
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
            Invoice Generated
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Financial records posted for{" "}
            <span className="font-black text-slate-900 dark:text-white uppercase">
              {activeOrder.plate}
            </span>
            .
          </p>

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5 mb-4">
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Document No.
                </p>
                <p className="text-lg font-mono font-black text-indigo-500">
                  INV-CAB-0090
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Terms
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {paymentTerm.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> Audit
                  Trail Locked
                </p>
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                  <Building size={12} className="text-indigo-400" /> GL Posted
                  (5 Entries)
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Amount Due
                </p>
                <p className="text-2xl font-mono font-black text-emerald-500">
                  ₱
                  {activeOrder.totals.grand.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => alert("Downloading PDF Snapshot...")}
              className="w-full py-4 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> Download Static PDF
            </button>
            {paymentTerm === "COD" ? (
              <button
                onClick={() => alert("Navigating to Payments Posting...")}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                Post Payment Now <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                Back to Queue <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Invoices;
