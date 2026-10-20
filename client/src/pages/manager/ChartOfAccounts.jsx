import React, { useState, useEffect, useCallback, useId } from "react";
import {
  BookOpen,
  Archive,
  RotateCcw,
  Edit2,
  Lock,
  History,
  Plus,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { chartOfAccountsService } from "../../services/manager/chartOfAccounts.service";
import AccountModal from "../../features/manager/components/AccountModal";
import AccountUsageDrawer from "../../features/manager/components/AccountUsageDrawer";

// --- REUSABLE SHARED COMPONENTS ---
import ConfirmModal from "../../components/shared/ConfirmModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusBadge from "../../components/ui/StatusBadge";

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

const STATUS_OPTIONS = [
  { label: "Active", value: false },
  { label: "Inactive", value: true },
];

const ITEMS_PER_PAGE = 10;

const ChartOfAccounts = () => {
  const { showToast } = useApp();
  const typeFilterSelectId = useId();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStatusToggle = (value) => {
    setShowArchived(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setTypeFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadAccounts = useCallback(async () => {
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

      const fetchedAccounts = response.data?.accounts || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedAccounts.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setAccounts(fetchedAccounts);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load Chart of Accounts directory.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, typeFilter, showArchived, showToast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleModalSubmit = async (formData) => {
    if (selectedAccount) {
      await chartOfAccountsService.updateAccount(selectedAccount.id, formData);
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
  };

  const handleToggleStatus = (account) => {
    if (account.is_system && account.is_active) {
      showToast("Critical system accounts cannot be deactivated.", "warning");
      return;
    }

    const action = account.is_active ? "Deactivate" : "Reactivate";
    const variant = account.is_active ? "danger" : "info";
    const msg = account.is_active
      ? `Are you sure you want to deactivate ${account.account_code} (${account.account_name})? It will be hidden from operational dropdowns but retained for historical reporting.`
      : `Are you sure you want to reactivate ${account.account_code} (${account.account_name})?`;

    setConfirmConfig({
      isOpen: true,
      title: `${action} Account`,
      message: msg,
      confirmText: `Yes, ${action}`,
      variant,
      onConfirm: async () => {
        try {
          await chartOfAccountsService.toggleAccountStatus(
            account.id,
            !account.is_active,
          );
          showToast(
            `${account.account_code} ${
              account.is_active ? "deactivated" : "reactivated"
            } successfully.`,
            "success",
          );
          loadAccounts();
        } catch (error) {
          showToast(
            error.message || "Failed to update account status.",
            "error",
          );
        }
      },
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "ASSET":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20";
      case "LIABILITY":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
      case "EQUITY":
        return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20";
      case "INCOME":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20";
      case "EXPENSE":
        return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-300 border border-slate-200 dark:border-slate-600";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* ACTION BAR */}
      <PageHeader
        title="Chart of Accounts"
        subtitle="Master Financial Directory"
        icon={BookOpen}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Code or Name..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={showArchived}
          onToggle={handleStatusToggle}
          ariaLabel="Filter accounts by active or inactive status"
          options={STATUS_OPTIONS}
        />

        <ActionButton
          onClick={() => {
            setSelectedAccount(null);
            setIsModalOpen(true);
          }}
          label="Register Account"
          icon={Plus}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Chart of Accounts and Master Financial Ledger Directory"
        minWidth="min-w-[850px]"
        headers={[
          "Account Profile",
          "Classification",
          "Rules & Dates",
          "Status",
          "Actions",
        ]}
        data={accounts}
        loading={loading}
        emptyTitle={`No ${showArchived ? "inactive" : "active"} accounts found`}
        emptySubtitle="Try adjusting your search or classification filter, or register a new ledger account."
        renderRow={(account) => {
          const isLockedSystem = account.is_system && account.is_active;

          return (
            <tr
              key={account.id}
              className={`group border-b border-slate-100 dark:border-white/5 last:border-0 ${
                !account.is_active
                  ? "bg-slate-50/70 dark:bg-slate-900/40 opacity-75"
                  : "table-row-hover"
              }`}
            >
              {/* Account Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div
                  className={`min-w-0 max-w-[240px] sm:max-w-[320px] flex items-start gap-3 ${
                    account.parent_id
                      ? "ml-5 sm:ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-3"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-start mt-0.5 shrink-0">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-900/70 dark:text-white border border-slate-200/80 dark:border-white/10 text-[10px] sm:text-xs font-black font-mono tabular-nums tracking-wider">
                      {account.account_code}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p
                      className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate"
                      title={account.account_name}
                    >
                      {account.account_name}
                    </p>
                    {account.parent_account_name ? (
                      <p
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 truncate"
                        title={`Sub-account of: ${account.parent_account_name}`}
                      >
                        Sub-account of: {account.parent_account_name}
                      </p>
                    ) : (
                      <p
                        className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5"
                        title={
                          account.description || "No description provided."
                        }
                      >
                        {account.description || "No description provided."}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Classification */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span
                  className={`inline-flex px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${getTypeBadge(
                    account.account_type,
                  )}`}
                >
                  {account.account_type}
                </span>
              </td>

              {/* Rules & Dates */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  {account.is_vat_applicable ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-overdrive-yellow">
                      VAT Target
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Non-VAT
                    </span>
                  )}
                  {account.is_system && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      <Lock size={10} aria-hidden="true" />
                      <span>System Locked</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    Created: {formatDate(account.created_at)}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                {!account.is_active ? (
                  <StatusBadge
                    variant="default"
                    label="Inactive"
                    icon={Archive}
                  />
                ) : (
                  <StatusBadge
                    variant="success"
                    label="Active"
                    icon={CheckCircle}
                  />
                )}
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsageAccountId(account.id);
                      setIsUsageDrawerOpen(true);
                    }}
                    title={`View Ledger Usage for ${account.account_code}`}
                    aria-label={`View account usage and ledger for ${account.account_code} ${account.account_name}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <History size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccount(account);
                      setIsModalOpen(true);
                    }}
                    title={`Edit Account ${account.account_code}`}
                    aria-label={`Edit account details for ${account.account_code} ${account.account_name}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit2 size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(account)}
                    disabled={isLockedSystem}
                    title={
                      isLockedSystem
                        ? "System accounts cannot be deactivated"
                        : account.is_active
                          ? `Deactivate ${account.account_code}`
                          : `Reactivate ${account.account_code}`
                    }
                    aria-label={
                      isLockedSystem
                        ? `System account ${account.account_code} cannot be deactivated`
                        : account.is_active
                          ? `Deactivate account ${account.account_code}`
                          : `Reactivate account ${account.account_code}`
                    }
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                      isLockedSystem
                        ? "text-slate-300 dark:text-slate-600 border-transparent cursor-not-allowed opacity-50"
                        : account.is_active
                          ? "text-slate-400 border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 active:scale-95 cursor-pointer"
                          : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                    }`}
                  >
                    {account.is_active ? (
                      <Archive size={16} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          );
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor={typeFilterSelectId} className="form-label">
              Account Type
            </label>
            <div className="relative">
              <select
                id={typeFilterSelectId}
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All Classifications" : t}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </FilterModal>

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
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
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
