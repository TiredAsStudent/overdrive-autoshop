import React, { useState, useEffect } from "react";
import {
  Plus,
  Archive,
  Search,
  Loader2,
  BookOpen,
  RotateCcw,
  Edit2,
  Filter,
  X,
  Lock,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chartOfAccountsService } from "../../services/manager/chartOfAccounts.service";
import AccountModal from "../../features/manager/components/AccountModal";
import AccountUsageDrawer from "../../features/manager/components/AccountUsageDrawer";
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ACCOUNT_TYPES = [
  "all",
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

const ChartOfAccounts = () => {
  const { showToast } = useApp();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isUsageDrawerOpen, setIsUsageDrawerOpen] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [usageAccountId, setUsageAccountId] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  const activeFilterCount = typeFilter !== "all" ? 1 : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, typeFilter, showArchived]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const statusParam = showArchived ? "inactive" : "active";
      const response = await chartOfAccountsService.getAccounts(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        typeFilter,
        statusParam,
      );
      setAccounts(response.data?.accounts || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [currentPage, debouncedSearchQuery, typeFilter, showArchived]);

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedAccount) {
        await chartOfAccountsService.updateAccount(
          selectedAccount.id,
          formData,
        );
        showToast(`${formData.account_code} updated successfully.`, "success");
      } else {
        await chartOfAccountsService.createAccount(formData);
        showToast(
          `Account ${formData.account_code} created successfully.`,
          "success",
        );
      }
      setIsModalOpen(false);
      loadAccounts();
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = (account) => {
    if (account.is_system && account.is_active) {
      showToast("Critical system accounts cannot be deactivated.", "warning");
      return;
    }

    const action = account.is_active ? "Deactivate" : "Reactivate";
    const variant = account.is_active ? "danger" : "info";
    const msg = account.is_active
      ? `Are you sure you want to deactivate ${account.account_code}? It will be hidden from operational dropdowns but retained for history.`
      : `Are you sure you want to reactivate ${account.account_code}?`;

    setConfirmConfig({
      isOpen: true,
      title: `${action} Account`,
      message: msg,
      confirmText: `Yes, ${action}`,
      variant: variant,
      onConfirm: async () => {
        try {
          await chartOfAccountsService.toggleAccountStatus(
            account.id,
            !account.is_active,
          );
          showToast(
            `${account.account_code} ${account.is_active ? "deactivated" : "reactivated"} successfully.`,
            "success",
          );
          loadAccounts();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "ASSET":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20";
      case "LIABILITY":
        return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
      case "EQUITY":
        return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20";
      case "INCOME":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
      case "EXPENSE":
        return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
      default:
        return "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <BookOpen className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Chart of Accounts
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Master Financial Directory
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[200px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search Code or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Filter size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-900 shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${!showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${showArchived ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedAccount(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Plus size={16} /> Register Account
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Account Profile",
          "Classification",
          "Rules",
          "Status",
          "Actions",
        ]}
        data={accounts}
        loading={loading}
        emptyTitle={`No ${showArchived ? "inactive" : "active"} accounts found`}
        renderRow={(account) => (
          <tr
            key={account.id}
            className={`group transition-colors ${!account.is_active ? "bg-slate-50 dark:bg-slate-900/40 opacity-75 grayscale" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"}`}
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div
                className={`min-w-0 max-w-[200px] sm:max-w-[300px] flex items-start gap-3 ${account.parent_id ? "ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-3" : ""}`}
              >
                <div className="flex flex-col items-start mt-0.5">
                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-black text-slate-800 dark:text-white font-mono tracking-wider shadow-sm">
                    {account.account_code}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                    {account.account_name}
                  </p>
                  {account.parent_account_name ? (
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                      Sub-account of: {account.parent_account_name}
                    </p>
                  ) : (
                    <p
                      className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                      title={account.description}
                    >
                      {account.description || "No description provided."}
                    </p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${getTypeBadge(account.account_type)}`}
              >
                {account.account_type}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1.5">
                {account.is_vat_applicable ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">
                    VAT Target
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Non-VAT
                  </span>
                )}
                {account.is_system && (
                  <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-blue-500">
                    <Lock size={10} /> System Locked
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              {!account.is_active ? (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <Archive size={12} /> Inactive
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Active
                </span>
              )}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setUsageAccountId(account.id);
                    setIsUsageDrawerOpen(true);
                  }}
                  title="View Account Usage & Ledger"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <History size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>
                <button
                  onClick={() => {
                    setSelectedAccount(account);
                    setIsModalOpen(true);
                  }}
                  title="Edit Account Details"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>
                <button
                  onClick={() => handleToggleStatus(account)}
                  disabled={account.is_system && account.is_active}
                  title={
                    account.is_system && account.is_active
                      ? "System accounts cannot be deactivated"
                      : "Toggle Status"
                  }
                  className={`p-1.5 sm:p-2.5 rounded-xl transition-colors ${
                    account.is_system && account.is_active
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : account.is_active
                        ? "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        : "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 cursor-pointer"
                  }`}
                >
                  {account.is_active ? (
                    <Archive size={14} className="sm:w-[16px] sm:h-[16px]" />
                  ) : (
                    <RotateCcw size={14} className="sm:w-[16px] sm:h-[16px]" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* FILTER MODAL */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
                  <Filter size={16} className="text-amber-500" /> Advanced
                  Filters
                </h3>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  Account Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All Classifications" : t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex gap-3">
                <button
                  onClick={() => setTypeFilter("all")}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedAccount}
      />

      <AccountUsageDrawer
        isOpen={isUsageDrawerOpen}
        onClose={() => setIsUsageDrawerOpen(false)}
        accountId={usageAccountId}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default ChartOfAccounts;
