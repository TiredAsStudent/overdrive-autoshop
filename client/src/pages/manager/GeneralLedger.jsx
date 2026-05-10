import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  MapPin,
  Calendar,
  Filter,
  Eye,
  ShieldCheck,
  FileText,
  X,
  Link as LinkIcon,
} from "lucide-react";

// --- DUMMY DATA FOR MOCKUP ---
// Represents the individual lines in the general_ledger table
const MOCK_LEDGER_LINES = [
  // Transaction 1: Sales Invoice (Completed Job)
  {
    id: 101,
    txId: "TXN-CAB-0042",
    date: "2026-05-10",
    branch: "Calamba",
    accountCode: "1000",
    accountName: "Cash-on-Hand",
    type: "Asset",
    debit: 8500.0,
    credit: 0,
    source: "Invoice #1042",
  },
  {
    id: 102,
    txId: "TXN-CAB-0042",
    date: "2026-05-10",
    branch: "Calamba",
    accountCode: "4000",
    accountName: "Labor Revenue",
    type: "Revenue",
    debit: 0,
    credit: 7589.29,
    source: "Invoice #1042",
  },
  {
    id: 103,
    txId: "TXN-CAB-0042",
    date: "2026-05-10",
    branch: "Calamba",
    accountCode: "2100",
    accountName: "Output VAT Payable",
    type: "Liability",
    debit: 0,
    credit: 910.71,
    source: "Invoice #1042",
  },
  // Transaction 2: OCR Expense Approval (Buying Parts)
  {
    id: 104,
    txId: "TXN-BAT-0089",
    date: "2026-05-10",
    branch: "Batino",
    accountCode: "1200",
    accountName: "Inventory Assets",
    type: "Asset",
    debit: 12000.0,
    credit: 0,
    source: "OCR Receipt #89",
  },
  {
    id: 105,
    txId: "TXN-BAT-0089",
    date: "2026-05-10",
    branch: "Batino",
    accountCode: "1300",
    accountName: "Input VAT",
    type: "Asset",
    debit: 1440.0,
    credit: 0,
    source: "OCR Receipt #89",
  },
  {
    id: 106,
    txId: "TXN-BAT-0089",
    date: "2026-05-10",
    branch: "Batino",
    accountCode: "2000",
    accountName: "Accounts Payable",
    type: "Liability",
    debit: 0,
    credit: 13440.0,
    source: "OCR Receipt #89",
  },
  // Transaction 3: Manual Journal Entry (Depreciation)
  {
    id: 107,
    txId: "TXN-BIN-0105",
    date: "2026-05-09",
    branch: "Biñan",
    accountCode: "5500",
    accountName: "Depreciation Expense",
    type: "Expense",
    debit: 2500.0,
    credit: 0,
    source: "Manual JE #05",
  },
  {
    id: 108,
    txId: "TXN-BIN-0105",
    date: "2026-05-09",
    branch: "Biñan",
    accountCode: "1501",
    accountName: "Accumulated Depreciation",
    type: "Asset",
    debit: 0,
    credit: 2500.0,
    source: "Manual JE #05",
  },
];

const formatCurrency = (amount) => {
  if (amount === 0 || !amount) return "-";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const GeneralLedger = () => {
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxId, setSelectedTxId] = useState(null);

  // Filter Logic
  const filteredLines = useMemo(() => {
    return MOCK_LEDGER_LINES.filter((line) => {
      const matchesBranch =
        selectedBranch === "All" || line.branch === selectedBranch;
      const matchesSearch =
        line.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.accountCode.includes(searchQuery);
      return matchesBranch && matchesSearch;
    });
  }, [selectedBranch, searchQuery]);

  // System Integrity Check Math (Proving Debits = Credits)
  const totals = useMemo(() => {
    return filteredLines.reduce(
      (acc, line) => {
        acc.debit += line.debit;
        acc.credit += line.credit;
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [filteredLines]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01; // Float math safety

  // Modal Data Logic
  const modalData = selectedTxId
    ? MOCK_LEDGER_LINES.filter((line) => line.txId === selectedTxId)
    : [];

  const modalTotals = modalData.reduce(
    (acc, line) => {
      acc.debit += line.debit;
      acc.credit += line.credit;
      return acc;
    },
    { debit: 0, credit: 0 },
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10 relative">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <BookOpen className="text-indigo-500" size={28} />
            General Ledger
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Immutable Master Accounting Record
          </p>
        </div>

        {/* SYSTEM INTEGRITY CHECK (Proves ACID Compliance) */}
        <div
          className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
            isBalanced
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30"
              : "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30"
          }`}
        >
          {isBalanced ? (
            <ShieldCheck size={16} className="text-emerald-500" />
          ) : (
            <ShieldCheck size={16} className="text-red-500" />
          )}
          <div>
            <p
              className={`text-[9px] font-black uppercase tracking-widest ${isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {isBalanced ? "System Balanced" : "Imbalance Detected"}
            </p>
            <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
              DR: {formatCurrency(totals.debit)} = CR:{" "}
              {formatCurrency(totals.credit)}
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by Transaction ID, Account Name, or Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
          >
            <option value="All">All Branches</option>
            <option value="Calamba">Calamba</option>
            <option value="Batino">Batino</option>
            <option value="Biñan">Biñan</option>
          </select>
        </div>
        <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors">
          <Filter size={14} /> Advanced
        </button>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-white/10">
                <th className="p-4">Date</th>
                <th className="p-4">Txn ID (Ref)</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Account</th>
                <th className="p-4 text-right">Debit (DR)</th>
                <th className="p-4 text-right">Credit (CR)</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/5">
              {filteredLines.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-slate-500 italic text-xs"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => (
                  <tr
                    key={line.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-xs font-mono">{line.date}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {line.txId}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-widest">
                        {line.branch}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {line.accountName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Code: {line.accountCode} • {line.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(line.debit)}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(line.credit)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedTxId(line.txId)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 rounded-lg transition-colors"
                        title="View Full Entry"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILL-DOWN MODAL (Shows the full double-entry) */}
      {selectedTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-black/20">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                  <FileText className="text-indigo-500" size={20} />
                  Journal Entry Details
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Transaction Reference:{" "}
                  <span className="font-mono text-indigo-500">
                    {selectedTxId}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedTxId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: The T-Account View */}
            <div className="p-6 space-y-6">
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="p-3">Account Code & Name</th>
                    <th className="p-3 text-right border-l border-slate-200 dark:border-white/10">
                      Debit (₱)
                    </th>
                    <th className="p-3 text-right border-l border-slate-200 dark:border-white/10">
                      Credit (₱)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {modalData.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-slate-200 dark:border-white/10"
                    >
                      <td className="p-3">
                        <span className="font-mono text-xs text-slate-400 mr-2">
                          {line.accountCode}
                        </span>
                        {/* Indent credits slightly for standard accounting visualization */}
                        <span
                          className={
                            line.credit > 0
                              ? "ml-4 text-slate-600 dark:text-slate-400"
                              : "font-bold"
                          }
                        >
                          {line.accountName}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono border-l border-slate-200 dark:border-white/10">
                        {formatCurrency(line.debit)}
                      </td>
                      <td className="p-3 text-right font-mono border-l border-slate-200 dark:border-white/10">
                        {formatCurrency(line.credit)}
                      </td>
                    </tr>
                  ))}
                  {/* Modal Totals Footer */}
                  <tr className="bg-slate-50 dark:bg-black/20">
                    <td className="p-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Balanced Totals
                    </td>
                    <td className="p-3 text-right font-mono font-black border-l border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(modalTotals.debit)}
                    </td>
                    <td className="p-3 text-right font-mono font-black border-l border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(modalTotals.credit)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Source Document Link (Proves the OCR integration) */}
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Source Document
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {modalData[0]?.source}
                  </p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                  <LinkIcon size={12} /> View Physical Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
