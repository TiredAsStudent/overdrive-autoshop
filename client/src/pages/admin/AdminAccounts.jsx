import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  PieChart,
  ArrowUpCircle,
  ArrowDownCircle,
  Layers,
  Calculator,
  Landmark,
  X,
  Edit2,
  Loader2,
} from "lucide-react";
import financeService from "../../services/financeService";

const AdminAccounts = () => {
  // --- UI STATE ---
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DATA STATE ---
  const [accounts, setAccounts] = useState([]);
  const [kpi, setKpi] = useState({ income: 0, expense: 0, net: 0 });

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" or "EDIT"
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "INCOME",
    description: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to map UI string to Database ID
  const getBranchId = (branchName) => {
    switch (branchName) {
      case "Main":
        return 1;
      case "Second":
        return 2;
      case "Third":
        return 3;
      default:
        return null; // "All Branches"
    }
  };

  // --- CORE DATA ENGINE ---
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branchId = getBranchId(selectedBranch);

      // Fetch Categories and Balances at the same time for speed
      const [categoriesData, balancesData] = await Promise.all([
        financeService.getCategories(),
        financeService.getBalances(branchId),
      ]);

      let totalIncome = 0;
      let totalExpense = 0;

      // Merge the SQL Ledger Balances into the Categories array
      const mergedAccounts = categoriesData.map((category) => {
        const balanceRecord = balancesData.find(
          (b) => b.category_id === category.id,
        );
        const currentBalance = balanceRecord
          ? parseFloat(balanceRecord.current_balance)
          : 0;

        // KPI Calculation: Only count ACTIVE buckets for the top cards
        if (category.is_active) {
          if (category.type === "INCOME") totalIncome += currentBalance;
          if (category.type === "EXPENSE") totalExpense += currentBalance;
        }

        return { ...category, balance: currentBalance };
      });

      setAccounts(mergedAccounts);
      setKpi({
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  // Trigger fetch when component mounts or branch lens changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode("CREATE");
    setFormData({ name: "", type: "INCOME", description: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setModalMode("EDIT");
    setEditingId(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      description: account.description || "",
      is_active: account.is_active,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "CREATE") {
        await financeService.createCategory(formData);
      } else {
        await financeService.updateCategory(editingId, formData);
      }
      setIsModalOpen(false);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatMoney = (amount) => {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* 1. TOP KPI CARDS: FINANCIAL PULSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 text-emerald-500 mb-4">
            <ArrowUpCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Gross Enterprise Income
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic">
            {isLoading ? (
              <span className="text-slate-300 dark:text-slate-600">
                Calculating...
              </span>
            ) : (
              formatMoney(kpi.income)
            )}
          </h3>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <ArrowDownCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Total Operating Expenses
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic">
            {isLoading ? (
              <span className="text-slate-300 dark:text-slate-600">
                Calculating...
              </span>
            ) : (
              formatMoney(kpi.expense)
            )}
          </h3>
        </div>

        {/* Net Margin Card */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <PieChart size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <Calculator size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Estimated Net Margin
              </span>
            </div>
            <h3 className="text-3xl font-black italic">
              {isLoading ? (
                <span className="text-slate-700">Calculating...</span>
              ) : (
                formatMoney(kpi.net)
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. ACCOUNT MANAGEMENT CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Branch Lens Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {["All Branches", "Main", "Second", "Third"].map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                selectedBranch === branch
                  ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> New Account
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50 font-bold flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. THE MASTER CHART OF ACCOUNTS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative min-h-[300px]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Ledger...
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-5">Account Code & Name</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5 text-right">Enterprise Total</th>
                <th className="px-8 py-5 text-right">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filteredAccounts.map((acc) => (
                <tr
                  key={acc.id}
                  className={`group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${!acc.is_active ? "opacity-50 grayscale" : ""}`}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${acc.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                      >
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white italic tracking-tight uppercase flex items-center gap-2">
                          {acc.name}
                          {!acc.is_active && (
                            <span className="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full not-italic">
                              ARCHIVED
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          COA ID: {acc.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                        acc.type === "INCOME"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {acc.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter italic">
                      {formatMoney(acc.balance)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Running Balance
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      {acc.type === "EXPENSE" && acc.is_active && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Staff OCR Dropdown
                        </div>
                      )}
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {filteredAccounts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="inline-flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-20" />
                      <p className="text-sm font-bold">No accounts found.</p>
                      <p className="text-xs mt-1">
                        Try adjusting your search or create a new account.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. GOVERNANCE INTEGRATION NOTE */}
      <div className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-slate-900 rounded-2xl shrink-0">
            <Landmark size={24} />
          </div>
          <div>
            <h4 className="font-black uppercase text-sm tracking-tight text-slate-900 dark:text-white italic">
              Maker-Checker Integration Active
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-2xl mt-1 leading-relaxed">
              Any changes made to this Chart of Accounts immediately update the
              database constraints. Only <strong>ACTIVE EXPENSE</strong>{" "}
              categories will be visible to the Staff in the OCR Intake module.
              This guarantees all manual uploads are pre-sorted into the correct
              financial buckets before reaching your Approval Queue.
            </p>
          </div>
        </div>
      </div>

      {/* 5. INLINE CRUD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  {modalMode === "CREATE"
                    ? "New Account Bucket"
                    : "Edit Account"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    Account Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Parts Procurement"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Only allow setting TYPE on Creation to protect Ledger Integrity */}
                {modalMode === "CREATE" && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                      Money Direction
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                      <option value="INCOME">Money IN (Income)</option>
                      <option value="EXPENSE">Money OUT (Expense)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                    Description (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Briefly describe what this account tracks..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none transition-colors"
                  />
                </div>

                {/* Only allow Archiving on Edit */}
                {modalMode === "EDIT" && (
                  <div className="flex items-center gap-3 pt-2 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-amber-500 bg-white border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor="isActiveToggle"
                        className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer select-none"
                      >
                        Account is Active
                      </label>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        If unchecked, this bucket will be hidden from staff and
                        excluded from KPI totals.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {modalMode === "CREATE"
                    ? "Save New Account"
                    : "Update Account"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAccounts;
