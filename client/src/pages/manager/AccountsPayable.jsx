import React, { useState, useMemo } from "react";
import {
  Landmark,
  MapPin,
  Download,
  AlertCircle,
  FileText,
  Search,
  Filter,
  DollarSign,
  UploadCloud,
  CheckCircle2,
  X,
  Clock,
  Wrench,
} from "lucide-react";

// --- DUMMY DATA ENGINE (AP Ledger) ---
const MOCK_AP_DATA = [
  {
    id: "INV-8821",
    vendor: "Prime Auto Parts Inc.",
    joRef: "JO-1042", // Linked to a specific customer job
    date: "2026-05-10",
    dueDate: "2026-06-10",
    total: 45000.0,
    paid: 0,
    status: "Unpaid",
    hasOCR: true,
    branch: "Calamba",
  },
  {
    id: "BILL-MER-05",
    vendor: "Meralco",
    joRef: null, // Overhead, not linked to a JO
    date: "2026-04-28",
    dueDate: "2026-05-12", // Overdue in this simulation
    total: 18500.0,
    paid: 0,
    status: "Overdue",
    hasOCR: true,
    branch: "Calamba",
  },
  {
    id: "INV-9932",
    vendor: "Industrial Lubes Co.",
    joRef: null,
    date: "2026-05-01",
    dueDate: "2026-05-30",
    total: 25000.0,
    paid: 10000.0, // Partial payment tracking
    status: "Partial",
    hasOCR: true,
    branch: "Batino",
  },
  {
    id: "INV-1002",
    vendor: "Snap-On Tools",
    joRef: null,
    date: "2026-05-15",
    dueDate: "2026-06-15",
    total: 12000.0,
    paid: 12000.0,
    status: "Paid",
    hasOCR: false, // Manual entry simulation
    branch: "Biñan",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const AccountsPayable = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [proofAttached, setProofAttached] = useState(false);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return MOCK_AP_DATA.filter((item) => {
      const matchBranch =
        selectedBranch === "All" || item.branch === selectedBranch;
      const matchStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchSearch =
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBranch && matchStatus && matchSearch;
    });
  }, [selectedBranch, statusFilter, searchTerm]);

  // --- AGING SUMMARY CALCULATIONS ---
  const summary = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        const balance = item.total - item.paid;
        if (balance > 0) {
          acc.totalOutstanding += balance;
          if (item.status === "Overdue") acc.overdue += balance;
          else acc.current += balance;
        }
        return acc;
      },
      { totalOutstanding: 0, current: 0, overdue: 0 },
    );
  }, [filteredData]);

  // --- MODAL HANDLERS ---
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.total - invoice.paid); // Default to full remaining balance
    setProofAttached(false);
    setIsModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleSimulateUpload = (e) => {
    e.preventDefault();
    setProofAttached(true);
  };

  const handleProcessPayment = () => {
    // In production, this fires an API call to update the DB and create a General Journal entry
    alert(
      `Payment of ₱${paymentAmount} processed for ${selectedInvoice.vendor}. Proof uploaded successfully.`,
    );
    closePaymentModal();
  };

  // --- UI HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "Overdue":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      case "Partial":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <Landmark className="text-amber-500" size={28} />
            Accounts Payable
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Supplier Debt & Liability Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="All">Consolidated (All)</option>
              <option value="Calamba">Calamba Branch</option>
              <option value="Batino">Batino Branch</option>
              <option value="Biñan">Biñan Branch</option>
            </select>
          </div>

          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Download size={16} /> Export Aging
          </button>
        </div>
      </div>

      {/* AGING SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Total Outstanding Debt
          </p>
          <h2 className="text-3xl font-mono font-black text-white">
            {formatCurrency(summary.totalOutstanding)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Total unpaid liabilities across selected branches.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Current (1 - 30 Days)
            </p>
          </div>
          <h2 className="text-3xl font-mono font-black text-slate-900 dark:text-white">
            {formatCurrency(summary.current)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Pending payments within terms.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-rose-200 dark:border-rose-500/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-rose-500" />
            <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">
              Overdue / Critical
            </p>
          </div>
          <h2 className="text-3xl font-mono font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.overdue)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Past due. Immediate action required.
          </p>
        </div>
      </div>

      {/* AP LEDGER & FILTERS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search vendor or Ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4 pl-6">Vendor & Details</th>
                <th className="p-4">Reference / JO</th>
                <th className="p-4 text-center">Due Date</th>
                <th className="p-4 text-right">Total Invoice</th>
                <th className="p-4 text-right">Remaining Bal.</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {filteredData.map((item) => {
                const balance = item.total - item.paid;
                const progress = (item.paid / item.total) * 100;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.vendor}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.branch} Branch
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          {item.id}
                          {item.hasOCR && (
                            <FileText
                              size={12}
                              className="text-indigo-400"
                              title="OCR Source Document Available"
                            />
                          )}
                        </span>
                        {item.joRef ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded w-max flex items-center gap-1">
                            <Wrench size={10} /> {item.joRef}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">
                            Overhead Cost
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <p
                        className={`font-mono text-xs ${item.status === "Overdue" ? "text-rose-500 font-bold" : "text-slate-500"}`}
                      >
                        {item.dueDate}
                      </p>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(balance)}
                      </p>
                      {item.paid > 0 && item.paid < item.total && (
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {balance > 0 ? (
                        <button
                          onClick={() => openPaymentModal(item)}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/30 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full border border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                        >
                          Pay Bill
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No payables found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PAYMENT MODAL (Maker-Checker Gate) --- */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="text-indigo-500" size={20} /> Record
                Payment
              </h3>
              <button
                onClick={closePaymentModal}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Invoice Summary */}
              <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Payee (Vendor)
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-3">
                  {selectedInvoice.vendor}
                </p>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Remaining Balance
                    </p>
                    <p className="text-lg font-mono font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(
                        selectedInvoice.total - selectedInvoice.paid,
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-white/10">
                    Ref: {selectedInvoice.id}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Amount to Pay (₱)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={selectedInvoice.total - selectedInvoice.paid}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="GCash">GCash Transfer</option>
                      <option value="Bank Transfer">
                        Bank Transfer (InstaPay)
                      </option>
                      <option value="Check">Corporate Check</option>
                      <option value="Cash">Cash Vault</option>
                    </select>
                  </div>
                </div>

                {/* Proof of Payment Gate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                    <span>
                      Proof of Payment <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-indigo-500">Required for Audit</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      proofAttached
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                        : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-500"
                    }`}
                  >
                    {proofAttached ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                          Receipt Uploaded
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <UploadCloud size={32} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">
                          Drag & drop GCash/Bank screenshot here
                        </p>
                        <button
                          onClick={handleSimulateUpload}
                          className="mt-2 px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          Browse Files
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={closePaymentModal}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={!proofAttached || !paymentAmount}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:shadow-none"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
