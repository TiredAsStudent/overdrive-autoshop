import React, { useState, useMemo } from "react";
import {
  Users,
  MapPin,
  Download,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  X,
  Wrench,
  BellRing,
  Mail,
  ShieldAlert,
  MoreVertical,
  FileX,
} from "lucide-react";

// --- DUMMY DATA ENGINE (AR Ledger) ---
const MOCK_AR_DATA = [
  {
    id: "INV-10042",
    customer: "LBC Express Fleet",
    type: "Corporate",
    joRef: "JO-2201",
    date: "2026-04-15",
    dueDate: "2026-05-15",
    total: 85000.0,
    paid: 0,
    status: "Current",
    creditLimit: 100000.0,
    branch: "Calamba",
    contact: "fleet.calamba@lbcexpress.com",
  },
  {
    id: "INV-10018",
    customer: "Mark Reyes (Restoration)",
    type: "Retail",
    joRef: "JO-2155",
    date: "2026-03-10",
    dueDate: "2026-04-10",
    total: 120000.0,
    paid: 50000.0,
    status: "Critical", // Over 30 days late
    creditLimit: 150000.0,
    branch: "Batino",
    contact: "0917-555-0192",
  },
  {
    id: "INV-10055",
    customer: "Grab Partner Coop",
    type: "Corporate",
    joRef: "JO-2210",
    date: "2026-05-01",
    dueDate: "2026-05-30",
    total: 45000.0,
    paid: 45000.0,
    status: "Settled",
    creditLimit: 50000.0,
    branch: "Biñan",
    contact: "admin@grabcoop.ph",
  },
  {
    id: "INV-10030",
    customer: "Sarah Jimenez",
    type: "Retail",
    joRef: "JO-2180",
    date: "2026-04-25",
    dueDate: "2026-05-05",
    total: 15000.0,
    paid: 0,
    status: "Late", // Under 30 days late
    creditLimit: 15000.0, // Maxed out
    branch: "Calamba",
    contact: "0918-222-3344",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount,
  );

const AccountsReceivable = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return MOCK_AR_DATA.filter((item) => {
      const matchBranch =
        selectedBranch === "All" || item.branch === selectedBranch;
      const matchStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchSearch =
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          acc.totalReceivables += balance;
          if (item.status === "Current") acc.current += balance;
          else if (item.status === "Late") acc.late += balance;
          else if (item.status === "Critical") acc.critical += balance;
        }
        return acc;
      },
      { totalReceivables: 0, current: 0, late: 0, critical: 0 },
    );
  }, [filteredData]);

  // --- HANDLERS ---
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.total - invoice.paid);
    setReferenceNumber("");
    setIsPaymentModalOpen(true);
    setActiveMenuId(null);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleProcessPayment = () => {
    alert(
      `Payment of ₱${paymentAmount} collected from ${selectedInvoice.customer}. AR ledger updated.`,
    );
    closePaymentModal();
  };

  const handlePingCustomer = (customer, contact) => {
    alert(`Automated Payment Reminder sent to ${customer} via ${contact}.`);
    setActiveMenuId(null);
  };

  const handleWriteOff = (invoiceId) => {
    const confirm = window.confirm(
      `WARNING: Are you sure you want to write off Invoice ${invoiceId} as Bad Debt? This will create a permanent expense entry in the General Ledger.`,
    );
    if (confirm)
      alert(`Invoice ${invoiceId} written off. Bad Debt Expense updated.`);
    setActiveMenuId(null);
  };

  // --- UI HELPERS ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "Settled":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "Current":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
      case "Late":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      case "Critical":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
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
            <Users className="text-emerald-500" size={28} />
            Accounts Receivable
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Collections & Credit Management
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
            <Download size={16} /> Export AR
          </button>
        </div>
      </div>

      {/* AGING SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 dark:bg-black/40 p-6 rounded-3xl border border-slate-700 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Total Receivables
            </p>
            <h2 className="text-3xl font-mono font-black text-emerald-400">
              {formatCurrency(summary.totalReceivables)}
            </h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Uncollected revenue (Assets).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-indigo-500" />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Current (Not Due)
            </p>
          </div>
          <h2 className="text-2xl font-mono font-black text-slate-900 dark:text-white">
            {formatCurrency(summary.current)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Within payment terms.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-amber-200 dark:border-amber-500/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-500" />
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">
              Late (1-30 Days)
            </p>
          </div>
          <h2 className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(summary.late)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            Requires follow-up.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-rose-200 dark:border-rose-500/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-rose-500" />
            <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-500 tracking-widest">
              Critical (31+ Days)
            </p>
          </div>
          <h2 className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.critical)}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-4">
            High risk of bad debt.
          </p>
        </div>
      </div>

      {/* CUSTOMER AR LEDGER */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search customer or JO..."
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
              <option value="Current">Current</option>
              <option value="Late">Late (1-30d)</option>
              <option value="Critical">Critical (31+d)</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4 pl-6">Customer & Credit Profile</th>
                <th className="p-4">Reference / JO</th>
                <th className="p-4 text-center">Due Date</th>
                <th className="p-4 text-right">Invoice Total</th>
                <th className="p-4 text-right">Owed Balance</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5 relative">
              {filteredData.map((item) => {
                const balance = item.total - item.paid;
                const creditUtilization = (balance / item.creditLimit) * 100;
                const isLimitReached = creditUtilization >= 95;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors relative"
                  >
                    {/* Customer Profile & Credit Gate */}
                    <td className="p-4 pl-6 w-64">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.customer}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.branch}
                        </span>
                      </div>
                      {balance > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1">
                            <span className="text-slate-400">Credit Limit</span>
                            <span
                              className={
                                isLimitReached
                                  ? "text-rose-500"
                                  : "text-slate-500"
                              }
                            >
                              {creditUtilization.toFixed(0)}% Used
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isLimitReached ? "bg-rose-500" : "bg-indigo-500"}`}
                              style={{ width: `${creditUtilization}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Job Order Ref */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-slate-900 dark:text-white font-bold">
                          {item.id}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded w-max flex items-center gap-1">
                          <Wrench size={10} /> {item.joRef}
                        </span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="p-4 text-center">
                      <p
                        className={`font-mono text-xs ${item.status === "Critical" || item.status === "Late" ? "text-rose-500 font-bold" : "text-slate-500"}`}
                      >
                        {item.dueDate}
                      </p>
                    </td>

                    {/* Totals */}
                    <td className="p-4 text-right font-mono text-slate-900 dark:text-white">
                      {formatCurrency(item.total)}
                    </td>

                    {/* Remaining Owed */}
                    <td className="p-4 text-right">
                      <p className="font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(balance)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Action Menu */}
                    <td className="p-4 pr-6 text-center relative">
                      {balance > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPaymentModal(item)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border border-emerald-200 dark:border-emerald-500/20"
                          >
                            Receive
                          </button>

                          {/* Three Dot Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === item.id ? null : item.id,
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-100">
                                <button
                                  onClick={() =>
                                    handlePingCustomer(
                                      item.customer,
                                      item.contact,
                                    )
                                  }
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <BellRing
                                    size={14}
                                    className="text-amber-500"
                                  />{" "}
                                  Send Reminder
                                </button>
                                <button
                                  onClick={() =>
                                    handlePingCustomer(
                                      item.customer,
                                      item.contact,
                                    )
                                  }
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-slate-100 dark:border-white/5"
                                >
                                  <Mail size={14} className="text-indigo-500" />{" "}
                                  Email Statement
                                </button>
                                <button
                                  onClick={() => handleWriteOff(item.id)}
                                  className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                                >
                                  <FileX size={14} /> Write-Off Debt
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PAYMENT SETTLEMENT MODAL --- */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="text-emerald-500" size={20} /> Receive
                Payment
              </h3>
              <button
                onClick={closePaymentModal}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">
                  Collecting From
                </p>
                <p className="text-sm font-black text-slate-900 dark:text-white mb-3">
                  {selectedInvoice.customer}
                </p>
                <div className="flex justify-between items-center border-t border-emerald-200/50 dark:border-emerald-500/20 pt-3">
                  <div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold">
                      Target Collection
                    </p>
                    <p className="text-lg font-mono font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(
                        selectedInvoice.total - selectedInvoice.paid,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Collected Amount (₱)
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
                    Bank / GCash Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TRN-00991823"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={closePaymentModal}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={!paymentAmount || !referenceNumber}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none"
              >
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivable;
