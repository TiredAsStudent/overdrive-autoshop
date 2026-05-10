import React, { useState } from "react";
import {
  Wallet,
  Search,
  CheckCircle,
  Clock,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Printer,
  AlertCircle,
  FileText,
  XCircle,
  ShieldAlert,
} from "lucide-react";

// --- MOCK DATA ENGINE ---
const INITIAL_INVOICES = [
  {
    id: "INV-CAB-0089",
    plate: "ABC-9999",
    customer: "Maria Clara",
    total: 4500,
    paid: 0,
    balance: 4500,
    status: "UNPAID",
    terms: "NET_7",
  },
  {
    id: "INV-CAB-0090",
    plate: "NCO-1234",
    customer: "Juan Dela Cruz",
    total: 2300,
    paid: 1000,
    balance: 1300,
    status: "PARTIAL",
    terms: "COD",
  },
];

const INITIAL_COLLECTIONS = [
  {
    orNumber: "OR-CAB-0001",
    invoiceId: "INV-CAB-0090",
    amount: 1000,
    method: "GCASH",
    refNo: "8472938492",
    time: "10:30 AM",
    status: "VALID",
  },
];

const PaymentsPostings = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("DASHBOARD"); // DASHBOARD | COLLECTION | SUCCESS

  // Data State
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [collections, setCollections] = useState(INITIAL_COLLECTIONS);
  const [searchQuery, setSearchQuery] = useState("");

  // Active Payment State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH"); // CASH | GCASH | BANK
  const [referenceNo, setReferenceNo] = useState("");
  const [lastGeneratedOR, setLastGeneratedOR] = useState(null);

  // --- LOGIC HANDLERS ---
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.plate.includes(searchQuery.toUpperCase()) ||
      inv.id.includes(searchQuery.toUpperCase()),
  );

  const openCollection = (invoice) => {
    setActiveInvoice(invoice);
    setPayAmount(invoice.balance.toString()); // Default to full balance
    setPayMethod("CASH");
    setReferenceNo("");
    setView("COLLECTION");
  };

  const closeCollection = () => {
    setActiveInvoice(null);
    setView("DASHBOARD");
  };

  const handlePostPayment = () => {
    const amount = parseFloat(payAmount);

    // 1. Validations
    if (isNaN(amount) || amount <= 0)
      return alert("Amount must be greater than zero.");
    if (amount > activeInvoice.balance)
      return alert("Payment cannot exceed the remaining balance.");
    if (payMethod !== "CASH" && !referenceNo.trim())
      return alert(`A Reference Number is required for ${payMethod} payments.`);

    // 2. Process Data
    const newBalance = activeInvoice.balance - amount;
    const newStatus = newBalance === 0 ? "PAID" : "PARTIAL";

    // Generate OR Number (Mock logic)
    const newOrNumber = `OR-CAB-${String(collections.length + 2).padStart(4, "0")}`;

    const newCollection = {
      orNumber: newOrNumber,
      invoiceId: activeInvoice.id,
      amount: amount,
      method: payMethod,
      refNo: payMethod === "CASH" ? "N/A" : referenceNo,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "VALID",
    };

    // 3. Update State
    setCollections([newCollection, ...collections]);

    setInvoices((prev) =>
      prev
        .map((inv) =>
          inv.id === activeInvoice.id
            ? {
                ...inv,
                paid: inv.paid + amount,
                balance: newBalance,
                status: newStatus,
              }
            : inv,
        )
        .filter((inv) => inv.balance > 0),
    ); // Remove from queue if fully paid

    setLastGeneratedOR({
      ...newCollection,
      newBalance,
      customer: activeInvoice.customer,
      plate: activeInvoice.plate,
    });
    setView("SUCCESS");
  };

  const handleVoidPayment = (orNumber) => {
    const confirm = window.confirm(
      `SECURITY WARNING:\n\nAre you sure you want to VOID Official Receipt ${orNumber}?\nThis will reverse the General Ledger entry and restore the customer's balance. This action will be permanently logged in the Audit Trail.`,
    );
    if (confirm) {
      setCollections((prev) =>
        prev.map((c) =>
          c.orNumber === orNumber ? { ...c, status: "VOIDED" } : c,
        ),
      );
      alert("Payment successfully voided. Audit trail updated.");
      // In a real system, you'd also reverse the invoice balance here.
    }
  };

  // --- UI HELPERS ---
  const getMethodConfig = (method) => {
    switch (method) {
      case "CASH":
        return {
          icon: <Banknote size={16} />,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500",
        };
      case "GCASH":
        return {
          icon: <Smartphone size={16} />,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500",
        };
      case "BANK":
        return {
          icon: <CreditCard size={16} />,
          color: "text-indigo-500",
          bg: "bg-indigo-500/10",
          border: "border-indigo-500",
        };
      default:
        return {
          icon: <Wallet size={16} />,
          color: "text-slate-500",
          bg: "bg-slate-500/10",
          border: "border-slate-500",
        };
    }
  };

  // =================================================================================================
  // VIEW 1: DASHBOARD (Receivables & Daily Shift Collections)
  // =================================================================================================
  if (view === "DASHBOARD") {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        {/* HEADER & METRICS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              <Wallet className="text-indigo-500" size={28} />
              Payment Postings
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Calamba Branch • Accounts Receivable & Collections
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-xl text-right">
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Shift Total (Cash Only)
              </p>
              <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₱
                {collections
                  .filter((c) => c.method === "CASH" && c.status === "VALID")
                  .reduce((acc, c) => acc + c.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-2 rounded-xl text-right">
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Shift Total (Digital)
              </p>
              <p className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                ₱
                {collections
                  .filter((c) => c.method !== "CASH" && c.status === "VALID")
                  .reduce((acc, c) => acc + c.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: OUTSTANDING INVOICES */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" /> Outstanding
                Balances
              </h3>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search Plate or INV..."
                  className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg outline-none text-xs font-bold focus:border-indigo-500 transition-colors uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">
                        {inv.id}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${inv.status === "PARTIAL" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400" : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400"}`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                        {inv.terms.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                        {inv.plate}
                      </p>
                      <span className="text-slate-300 dark:text-slate-600">
                        |
                      </span>
                      <p className="text-xs font-bold text-slate-500">
                        {inv.customer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Balance Due
                      </p>
                      <p className="text-xl font-mono font-black text-rose-500 leading-none">
                        ₱
                        {inv.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {inv.paid > 0 && (
                        <p className="text-[9px] font-bold text-emerald-500 mt-1">
                          Paid: ₱{inv.paid.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openCollection(inv)}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                      Collect <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredInvoices.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No outstanding invoices found.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DAILY COLLECTIONS LOG */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Clock size={16} /> Today's Receipts
            </h3>
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-xl overflow-hidden p-4 space-y-3">
              {collections.map((c) => {
                const conf = getMethodConfig(c.method);
                return (
                  <div
                    key={c.orNumber}
                    className={`p-4 rounded-2xl border ${c.status === "VOIDED" ? "bg-slate-800/50 border-slate-700 opacity-50" : "bg-slate-800 border-slate-700"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${conf.bg} ${conf.color}`}
                        >
                          {conf.icon}
                        </div>
                        <p className="text-[10px] font-mono font-black text-slate-300">
                          {c.orNumber}
                        </p>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500">
                        {c.time}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          To: {c.invoiceId}
                        </p>
                        {c.refNo !== "N/A" && (
                          <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                            Ref: {c.refNo}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-mono font-black ${c.status === "VOIDED" ? "text-slate-500 line-through" : "text-white"}`}
                        >
                          ₱{c.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* VOID BUTTON - Only available for active receipts */}
                    {c.status === "VALID" && (
                      <button
                        onClick={() => handleVoidPayment(c.orNumber)}
                        className="mt-3 w-full py-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-1"
                      >
                        <XCircle size={10} /> Void Receipt
                      </button>
                    )}
                    {c.status === "VOIDED" && (
                      <p className="mt-2 text-[9px] font-black text-rose-500 uppercase tracking-widest text-center">
                        Reversed in GL
                      </p>
                    )}
                  </div>
                );
              })}
              {collections.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-500 py-6 uppercase tracking-widest">
                  No collections yet today.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 2: PAYMENT COLLECTION FORM
  // =================================================================================================
  if (view === "COLLECTION") {
    return (
      <div className="max-w-3xl mx-auto mt-6 animate-in slide-in-from-right-4 duration-500 pb-24">
        <button
          onClick={closeCollection}
          className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-500 mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Back to Queue
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-slate-900 p-6 md:p-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
                  Payment Posting
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Settling Account for{" "}
                  <span className="text-white font-bold">
                    {activeInvoice.customer}
                  </span>{" "}
                  ({activeInvoice.plate})
                </p>
              </div>
              <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                {activeInvoice.id}
              </span>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Invoice Total
                </p>
                <p className="text-sm font-mono text-slate-300">
                  ₱
                  {activeInvoice.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  Current Balance Due
                </p>
                <p className="text-3xl font-mono font-black text-rose-500">
                  ₱
                  {activeInvoice.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 md:p-8 space-y-8">
            {/* 1. Payment Amount */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                Amount to Collect (₱)
              </label>
              <input
                type="number"
                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 focus:border-emerald-500 rounded-2xl outline-none text-3xl font-mono font-black text-slate-900 dark:text-emerald-400 transition-all"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={activeInvoice.balance}
              />
              <div className="flex justify-between items-center mt-2 px-1">
                <p className="text-[10px] text-slate-400 font-bold">
                  You can enter a partial amount.
                </p>
                {parseFloat(payAmount) < activeInvoice.balance &&
                  parseFloat(payAmount) > 0 && (
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      Remaining: ₱
                      {(
                        activeInvoice.balance - parseFloat(payAmount)
                      ).toLocaleString()}
                    </p>
                  )}
              </div>
            </div>

            {/* 2. Payment Method */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "CASH", label: "Cash", icon: <Banknote size={20} /> },
                  {
                    id: "GCASH",
                    label: "GCash / Maya",
                    icon: <Smartphone size={20} />,
                  },
                  {
                    id: "BANK",
                    label: "Bank Transfer",
                    icon: <CreditCard size={20} />,
                  },
                ].map((method) => {
                  const isSelected = payMethod === method.id;
                  const conf = getMethodConfig(method.id);
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPayMethod(method.id)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? `${conf.border} ${conf.bg}` : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20"}`}
                    >
                      <div
                        className={isSelected ? conf.color : "text-slate-400"}
                      >
                        {method.icon}
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? conf.color : "text-slate-500"}`}
                      >
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Reference Number (Conditional) */}
            {payMethod !== "CASH" && (
              <div className="animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 flex items-center gap-1">
                  Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter Transaction ID from app..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 focus:border-blue-500 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-white transition-all font-mono"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
                <p className="text-[9px] text-slate-400 mt-1 ml-1 font-bold">
                  Mandatory for digital reconciliation against bank statements.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={closeCollection}
                className="px-6 py-4 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePostPayment}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                Post & Generate OR <CheckCircle size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================================================
  // VIEW 3: SUCCESS & OFFICIAL RECEIPT
  // =================================================================================================
  if (view === "SUCCESS") {
    return (
      <div className="max-w-xl mx-auto mt-12 animate-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-500" size={40} />
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
            Payment Posted
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            General Ledger updated and cash flow recorded.
          </p>

          {/* The Digital OR Snapshot */}
          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 text-left relative">
            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg rounded-tr-xl">
              Official Receipt
            </div>

            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Receipt Number
            </p>
            <p className="text-xl font-mono font-black text-slate-900 dark:text-white mb-6">
              {lastGeneratedOR.orNumber}
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                <span className="text-slate-500">Applied To</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {lastGeneratedOR.invoiceId}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                <span className="text-slate-500">Received From</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {lastGeneratedOR.customer} ({lastGeneratedOR.plate})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-bold text-indigo-500">
                  {lastGeneratedOR.method}{" "}
                  {lastGeneratedOR.refNo !== "N/A"
                    ? `(${lastGeneratedOR.refNo})`
                    : ""}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-bold uppercase tracking-widest font-sans text-[10px]">
                  Amount Received
                </span>
                <span className="font-black text-emerald-500 text-lg">
                  ₱
                  {lastGeneratedOR.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {lastGeneratedOR.newBalance > 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-2">
                <ShieldAlert
                  size={14}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-tight">
                  This was a partial payment. Remaining balance of ₱
                  {lastGeneratedOR.newBalance.toLocaleString()} is still due.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() =>
                alert("Printing Official Receipt via Thermal Printer...")
              }
              className="w-full py-4 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Printer size={18} /> Print Official Receipt
            </button>
            <button
              onClick={() => setView("DASHBOARD")}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              Back to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentsPostings;
