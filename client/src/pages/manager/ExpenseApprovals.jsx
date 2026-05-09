import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  MapPin,
  Loader2,
  ScanFace,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { expenseService } from "../../services/manager/expense.service";
import ExpenseApprovalModal from "../../features/manager/components/ExpenseApprovalModal";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0,
  );

const ExpenseApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);

  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  // Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const initDropdowns = async () => {
      try {
        // Fetch both branches and suppliers at the exact same time for speed
        const [branchRes, supRes] = await Promise.all([
          expenseService.getActiveBranches(),
          expenseService.getSuppliers(),
        ]);
        setBranches(branchRes.data || []);
        setSuppliers(supRes.data || []);
      } catch (error) {
        console.error("Failed to load dropdown data:", error.message);
      }
    };
    initDropdowns();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await expenseService.getPending(selectedBranch);
      setExpenses(res.data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  // Actions
  const openVerification = (expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const handleApprove = async (id, data) => {
    await expenseService.approve(id, data);
    fetchQueue(); // Refresh queue after atomic success
  };

  const handleReject = async (id, reason) => {
    await expenseService.reject(id, reason);
    fetchQueue();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
            <CheckSquare
              className="text-indigo-600 dark:text-indigo-400"
              size={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
              Expense Verification
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-500 text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 normal-case tracking-widest uppercase border border-amber-200 dark:border-amber-500/30">
                {expenses.length} Pending
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              AI-Assisted Maker-Checker Queue
            </p>
          </div>
        </div>

        {/* Branch Filter */}
        <div className="relative w-full sm:w-56">
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
      </div>

      {/* QUEUE GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Scanning Queue...
          </p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 p-16 flex flex-col items-center justify-center text-center">
          <ScanFace
            size={60}
            className="text-slate-300 dark:text-slate-600 mb-6"
          />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
            Zero Pending Scans
          </h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            The verification queue is empty. All AI data has been processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
            >
              {/* Receipt Preview Thumbnail */}
              <div className="h-40 bg-slate-100 dark:bg-slate-900 relative overflow-hidden border-b border-slate-200 dark:border-white/10">
                <img
                  src={expense.receipt_image_url}
                  alt="Receipt Thumbnail"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                  <span className="text-white font-black uppercase text-xs tracking-widest drop-shadow-md">
                    {expense.supplier_name || "Unknown Supplier"}
                  </span>
                  <span className="bg-indigo-500 text-white text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-widest shadow-md">
                    OCR Scan
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Total Claimed
                    </p>
                    {expense.ai_confidence_score < 0.85 && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                        <AlertTriangle size={10} /> Review Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mb-4">
                    {formatCurrency(expense.total_amount)}
                  </p>

                  <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <p className="flex justify-between">
                      <span>Date:</span>{" "}
                      <span className="font-mono">
                        {new Date(
                          expense.transaction_date,
                        ).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Staff:</span> <span>{expense.staff_name}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openVerification(expense)}
                  className="mt-6 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
                >
                  <FileText size={14} /> Verify Data
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The Split-Screen Verification Modal */}
      <ExpenseApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={selectedExpense}
        onApprove={handleApprove}
        onReject={handleReject}
        suppliers={suppliers}
      />
    </div>
  );
};

export default ExpenseApprovals;
