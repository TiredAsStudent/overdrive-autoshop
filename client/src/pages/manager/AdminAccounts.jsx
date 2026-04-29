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
  X,
  Edit2,
  Loader2,
  Tag,
  Landmark,
  AlertCircle,
  Archive,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import financeService from "../../services/financeService";

const AdminAccounts = () => {
  // --- UI STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ACTIVE"); // "ACTIVE" or "ARCHIVED"
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL"); // NEW: Category Filter
  const [currentPage, setCurrentPage] = useState(1); // NEW: Pagination State
  const itemsPerPage = 10; // NEW: Rows per page

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);

  // --- DATA STATE ---
  const [baseCategories, setBaseCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dynamicBranches, setDynamicBranches] = useState([]);
  const [kpi, setKpi] = useState({ income: 0, expense: 0, net: 0 });

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category_id: "",
    account_code: "",
    account_name: "",
    staff_label: "",
    description: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CORE DATA ENGINE ---
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [categoriesRes, balancesRes] = await Promise.all([
        financeService.getBaseCategories(),
        financeService.getMultiBranchBalances(),
      ]);

      setBaseCategories(categoriesRes);
      setAccounts(balancesRes);

      if (balancesRes.length > 0) {
        const branches = balancesRes[0].balances.map((b) => ({
          id: b.branch_id,
          name: b.branch_name,
        }));
        setDynamicBranches(branches);
      }

      let totalIncome = 0;
      let totalExpense = 0;

      balancesRes.forEach((acc) => {
        const accountTotal = acc.balances.reduce((sum, b) => sum + b.amount, 0);
        // Only count ACTIVE accounts for the Enterprise KPIs
        if (acc.category === "Revenue" && acc.is_active === true)
          totalIncome += accountTotal;
        if (acc.category === "Expenses" && acc.is_active === true)
          totalExpense += accountTotal;
      });

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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // NEW: Reset Pagination to Page 1 if any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, selectedCategoryFilter]);

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setModalMode("CREATE");
    setModalError(null);
    setFormData({
      category_id: baseCategories[0]?.id || "",
      account_code: "",
      account_name: "",
      staff_label: "",
      description: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setModalMode("EDIT");
    setModalError(null);
    setEditingId(account.id);
    setFormData({
      account_name: account.name,
      staff_label: account.label,
      description: account.description || "",
      is_active: account.is_active === true,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (modalMode === "CREATE") {
        await financeService.createAccount({
          ...formData,
          category_id: parseInt(formData.category_id),
          account_code: parseInt(formData.account_code),
        });
      } else {
        await financeService.updateAccount(editingId, {
          account_name: formData.account_name,
          staff_label: formData.staff_label,
          description: formData.description,
          is_active: formData.is_active,
        });
      }
      setIsModalOpen(false);
      await fetchDashboardData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER HELPERS (UPDATED WITH MULTI-FILTER) ---
  const filteredAccounts = accounts.filter((acc) => {
    // 1. Check Search Query
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.toString().includes(searchQuery);

    // 2. Check Active vs Archived Tab
    const matchesTab =
      activeTab === "ACTIVE" ? acc.is_active === true : acc.is_active === false;

    // 3. Check Category Filter
    const matchesCategory =
      selectedCategoryFilter === "ALL" ||
      acc.category === selectedCategoryFilter;

    return matchesSearch && matchesTab && matchesCategory;
  });

  // --- PAGINATION MATH ---
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const formatMoney = (amount) => {
    return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* 1. TOP KPI CARDS: FINANCIAL PULSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="flex items-center gap-3 text-emerald-500 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Enterprise Revenue
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tight">
            {isLoading ? (
              <span className="text-slate-300 dark:text-slate-600">
                Syncing...
              </span>
            ) : (
              formatMoney(kpi.income)
            )}
          </h3>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 p-8 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Operating Expenses
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tight">
            {isLoading ? (
              <span className="text-slate-300 dark:text-slate-600">
                Syncing...
              </span>
            ) : (
              formatMoney(kpi.expense)
            )}
          </h3>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] border border-slate-800 shadow-lg text-white relative overflow-hidden hover:-translate-y-1 transition-all group">
          <div className="absolute right-[-10%] top-[-10%] p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <PieChart size={140} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Calculator size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">
                Estimated Net Margin
              </span>
            </div>
            <h3 className="text-3xl font-black italic tracking-tight">
              {isLoading ? (
                <span className="text-slate-700">Syncing...</span>
              ) : (
                formatMoney(kpi.net)
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. ACTIONS BAR WITH NEW TAB TOGGLE & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm gap-4">
        {/* Pill Toggle Switch */}
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-full lg:w-auto shrink-0">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`flex-1 lg:flex-none px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "ACTIVE"
                ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Layers size={14} /> Active
          </button>
          <button
            onClick={() => setActiveTab("ARCHIVED")}
            className={`flex-1 lg:flex-none px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === "ARCHIVED"
                ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Archive size={14} /> Archive
          </button>
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          {/* Category Dropdown Filter */}
          <div className="relative flex-1 sm:w-48">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-black/20 border border-transparent rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {baseCategories.map((cat) => (
                <option key={cat.id} value={cat.category_name}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codes..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-transparent rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-slate-900 transition-colors whitespace-nowrap shadow-sm shrink-0"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm border border-red-100 dark:border-red-900/50 font-bold flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="hover:text-red-800 dark:hover:text-red-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. MULTI-BRANCH ENTERPRISE TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm relative flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Compiling Ledger...
            </span>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-black/20 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="px-8 py-6">Account Code & Details</th>
                <th className="px-8 py-6">Category</th>
                {dynamicBranches.map((branch) => (
                  <th
                    key={branch.id}
                    className="px-8 py-6 text-right text-amber-600/80 dark:text-amber-500/80"
                  >
                    {branch.name}
                  </th>
                ))}
                <th className="px-8 py-6 text-right bg-slate-100/50 dark:bg-white/[0.02]">
                  Enterprise Total
                </th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {paginatedAccounts.map((acc) => {
                  const rowTotal = acc.balances.reduce(
                    (sum, b) => sum + b.amount,
                    0,
                  );

                  return (
                    <motion.tr
                      key={acc.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-2xl ${
                              activeTab === "ARCHIVED"
                                ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                            }`}
                          >
                            {activeTab === "ARCHIVED" ? (
                              <Archive size={18} />
                            ) : (
                              <Layers size={18} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2 tracking-tight">
                              {acc.code} - {acc.name}
                            </p>
                            <p
                              className={`text-[11px] font-bold flex items-center gap-1 mt-1.5 inline-flex px-2 py-0.5 rounded border ${
                                activeTab === "ARCHIVED"
                                  ? "text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                                  : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                              }`}
                            >
                              <Tag size={10} /> {acc.label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {acc.category}
                        </span>
                      </td>
                      {acc.balances.map((b) => (
                        <td
                          key={b.branch_id}
                          className="px-8 py-6 text-right font-mono text-sm text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {formatMoney(b.amount)}
                        </td>
                      ))}
                      <td className="px-8 py-6 text-right bg-slate-100/50 dark:bg-white/[0.02]">
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tighter italic">
                          {formatMoney(rowTotal)}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {paginatedAccounts.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={dynamicBranches.length + 4}
                    className="px-8 py-16 text-center"
                  >
                    <div className="inline-flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-white/5 p-8 rounded-3xl border border-slate-100 dark:border-white/5">
                      {activeTab === "ARCHIVED" ? (
                        <Archive size={32} className="mb-3 opacity-20" />
                      ) : (
                        <Search size={32} className="mb-3 opacity-20" />
                      )}
                      <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                        {activeTab === "ACTIVE"
                          ? "No matches found"
                          : "The Vault is empty"}
                      </p>
                      <p className="text-xs mt-1 text-slate-500">
                        {activeTab === "ACTIVE"
                          ? "Try adjusting your filters or search terms."
                          : "You have no archived accounts. Deactivating an account will store it here."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredAccounts.length > 0 && (
          <div className="px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.min(startIndex + itemsPerPage, filteredAccounts.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {filteredAccounts.length}
              </span>{" "}
              entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Simple logic to show only surrounding pages if there are many
                  if (
                    totalPages > 5 &&
                    (pageNum < currentPage - 1 || pageNum > currentPage + 1) &&
                    pageNum !== 1 &&
                    pageNum !== totalPages
                  ) {
                    if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={pageNum} className="text-slate-400 px-1">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "bg-amber-500 text-slate-900"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. INLINE CRUD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-[32px] p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white uppercase">
                  {modalMode === "CREATE"
                    ? "New Account Bucket"
                    : "Edit Account Details"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {modalMode === "CREATE" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                        Mother Category
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white transition-all"
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        {baseCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                        4-Digit Code
                      </label>
                      <input
                        required
                        type="number"
                        min="1000"
                        max="5999"
                        value={formData.account_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            account_code: e.target.value,
                          })
                        }
                        placeholder="e.g. 5100"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                    Technical Account Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.account_name}
                    onChange={(e) =>
                      setFormData({ ...formData, account_name: e.target.value })
                    }
                    placeholder="e.g. Utilities Expense"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="p-5 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                  <label className="block text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-1.5">
                    <Tag size={12} /> Staff-Facing Label (OCR Bridge)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.staff_label}
                    onChange={(e) =>
                      setFormData({ ...formData, staff_label: e.target.value })
                    }
                    placeholder="e.g. 💡 Electricity/Water"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-white shadow-sm transition-all"
                  />
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 mt-2 font-medium">
                    Keep this simple. It is the exact text staff will see in
                    their dropdowns.
                  </p>
                </div>

                {modalMode === "EDIT" && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl mt-4">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="checkbox"
                        id="active-toggle"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-amber-500 bg-white border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="active-toggle"
                        className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Account is Active
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Uncheck this to send the account to The Vault. It will
                        be hidden from staff and excluded from dashboard totals.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : modalMode === "CREATE" ? (
                    "Save New Account Bucket"
                  ) : (
                    "Update Account Details"
                  )}
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
