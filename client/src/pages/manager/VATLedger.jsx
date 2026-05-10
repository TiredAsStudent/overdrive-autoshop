import React, { useState, useEffect } from "react";
import {
  Calculator,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Scale,
  Lock,
  Unlock,
  Loader2,
  ShieldCheck,
  Search,
} from "lucide-react";
import { vatService } from "../../services/manager/vat.service";
import ConfirmModal from "../../components/shared/ConfirmModal";

// Helper to ensure professional Philippine Peso formatting
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0,
  );

const VATLedger = () => {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Filters (Default to current month YYYY-MM)
  const [taxPeriod, setTaxPeriod] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedBranch, setSelectedBranch] = useState("");

  // Data State
  const [summary, setSummary] = useState({
    total_output_vat: 0,
    total_input_vat: 0,
    net_vat_payable: 0,
    is_period_closed: false,
  });
  const [transactions, setTransactions] = useState([]);

  // Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Initialize branches on mount
  useEffect(() => {
    const initBranches = async () => {
      try {
        const branchRes = await vatService.getActiveBranches();
        setBranches(branchRes.data || []);
      } catch (error) {
        console.error("Branch load failed:", error.message);
      }
    };
    initBranches();
  }, []);

  // Fetch Ledger Data whenever filters change
  const loadLedger = async () => {
    if (!taxPeriod) return;
    setLoading(true);
    try {
      const res = await vatService.getLedger(taxPeriod, selectedBranch);
      setSummary(res.data.summary);
      setTransactions(res.data.transactions);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxPeriod, selectedBranch]);

  // Execute the Immutable Lock
  const handleClosePeriod = async () => {
    try {
      await vatService.closePeriod(taxPeriod);
      await loadLedger(); // Refresh to reflect the new "Locked" UI state
    } catch (error) {
      alert(`Closure Failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <Calculator
              className="text-indigo-600 dark:text-indigo-400"
              size={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              VAT Ledger
              {summary.is_period_closed ? (
                <span className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 normal-case tracking-widest uppercase border border-red-200 dark:border-red-500/30">
                  <Lock size={12} /> Closed
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 normal-case tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                  <Unlock size={12} /> Open
                </span>
              )}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Automated Tax Compliance Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Branch Filter */}
          <div className="relative w-full sm:w-48">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_code} - {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Period Picker */}
          <div className="relative w-full sm:w-48">
            <Calendar
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="month"
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* The Kill-Switch */}
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={
              summary.is_period_closed || loading || transactions.length === 0
            }
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <ShieldCheck size={16} /> Close Tax Period
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Output VAT (Liability from Sales) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
            <TrendingUp className="text-amber-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Output VAT (Sales)
            </p>
            <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.total_output_vat)}
            </p>
          </div>
        </div>

        {/* Input VAT (Savings from OCR Receipts) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
            <TrendingDown className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Input VAT (Purchases)
            </p>
            <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.total_input_vat)}
            </p>
          </div>
        </div>

        {/* Net Payable (Final BIR Computation) */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
            <Scale size={120} className="text-emerald-500" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 z-10">
            <Scale
              className="text-emerald-600 dark:text-emerald-400"
              size={24}
            />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">
              Net VAT Payable
            </p>
            <p className="text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatCurrency(summary.net_vat_payable)}
            </p>
          </div>
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[32px]">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Syncing Ledgers...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Origin Reference</th>
                <th className="px-8 py-5">Branch</th>
                <th className="px-8 py-5 text-right">Base Amount</th>
                <th className="px-8 py-5 text-right">12% VAT Tax</th>
                <th className="px-8 py-5 text-center">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                        {txn.reference_type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                        ID: {txn.reference_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-600">
                      {txn.branch_code}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right text-sm text-slate-500 font-mono">
                    {formatCurrency(txn.base_amount)}
                  </td>
                  <td className="px-8 py-5 text-right text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(txn.vat_amount)}
                  </td>
                  <td className="px-8 py-5 text-center">
                    {txn.transaction_type === "OUTPUT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                        <TrendingUp size={12} /> OUTPUT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">
                        <TrendingDown size={12} /> INPUT
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-8 py-20 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center opacity-60">
                      <Search
                        size={40}
                        className="mb-4 text-slate-300 dark:text-slate-600"
                      />
                      <p className="text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        No Tax Records Found
                      </p>
                      <p className="text-xs mt-2 font-medium">
                        There are no VAT transactions recorded for {taxPeriod}.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleClosePeriod}
        title="Lock Tax Period?"
        message={`Are you sure you want to finalize all transactions for ${taxPeriod}? This will etch the records into the audit trail and lock them permanently.`}
        confirmText="Yes, Lock Period"
        variant="danger"
      />
    </div>
  );
};

export default VATLedger;
