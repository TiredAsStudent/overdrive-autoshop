import React, { useState, useEffect, useCallback, useMemo, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Eye,
  ChevronDown,
} from "lucide-react";

// Services
import { trialBalanceService } from "../../services/manager/trialBalance.service";
import { inventoryService } from "../../services/manager/inventory.service";

// Shared Components
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import FilterModal from "../../components/shared/FilterModal";

// UI Components
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import ActionButton from "../../components/ui/ActionButton";
import StatCard from "../../components/ui/StatCard";

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

const TrialBalance = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  // Accessible Filter Modal Control IDs
  const branchFilterSelectId = useId();
  const typeFilterSelectId = useId();
  const cutoffDateInputId = useId();
  const hideZeroCheckboxId = useId();

  // State
  const [data, setData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [endDate, setEndDate] = useState("");
  const [hideZero, setHideZero] = useState(true);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (branchFilter !== "all" ? 1 : 0) +
    (endDate ? 1 : 0) +
    (!hideZero ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Trial Balance Data
  const loadTrialBalance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trialBalanceService.getTrialBalance({
        search: debouncedSearchQuery,
        type: typeFilter,
        branch: branchFilter,
        end_date: endDate,
        hide_zero: hideZero,
      });
      setData(res.data);
    } catch (error) {
      showToast(
        error.message || "Unable to load Trial Balance report.",
        "error",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchQuery,
    typeFilter,
    branchFilter,
    endDate,
    hideZero,
    showToast,
  ]);

  useEffect(() => {
    loadTrialBalance();
  }, [loadTrialBalance]);

  const resetFilters = () => {
    setTypeFilter("all");
    setBranchFilter("all");
    setEndDate("");
    setHideZero(true);
    setIsFilterModalOpen(false);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    }
    const [year, month, day] = String(dateString).split("T")[0].split("-");
    if (year && month && day) {
      const localDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      );
      if (!isNaN(localDate.getTime())) {
        return localDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
      }
    }
    const fallback = new Date(dateString);
    return isNaN(fallback.getTime())
      ? String(dateString)
      : fallback.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
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

  // Inject a Grand Total row for the DataTable
  const tableData = useMemo(() => {
    const accountsList = Array.isArray(data?.accounts)
      ? [...data.accounts]
      : [];
    if (accountsList.length > 0 && data?.summary) {
      accountsList.push({
        is_total_row: true,
        debit_balance: data.summary.total_debits,
        credit_balance: data.summary.total_credits,
      });
    }
    return accountsList;
  }, [data]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Trial Balance"
        subtitle="Mathematical Parity & Pre-Reporting Audit"
        icon={Scale}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search accounts..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          label="Export"
          icon={Download}
          onClick={() =>
            showToast("Excel export queued for reporting phase.", "info")
          }
        />
      </PageHeader>

      {/* KPI DASHBOARD */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 print:hidden">
          <StatCard
            title="Total Debit"
            value={`₱${formatCurrency(data.summary.total_debits)}`}
            icon={Calculator}
            variant="default"
          />
          <StatCard
            title="Total Credit"
            value={`₱${formatCurrency(data.summary.total_credits)}`}
            icon={Calculator}
            variant="default"
          />
          <StatCard
            title={data.summary.is_balanced ? "Balanced" : "Out of Balance"}
            value={
              data.summary.is_balanced
                ? "Perfect Parity"
                : `Diff: ₱${formatCurrency(data.summary.discrepancy)}`
            }
            icon={data.summary.is_balanced ? CheckCircle2 : AlertTriangle}
            variant={data.summary.is_balanced ? "success" : "danger"}
          />
        </div>
      )}

      {/* PRINT HEADER ONLY (Hidden on screen) */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-900 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          Trial Balance
        </h1>
        <p className="text-sm font-bold text-slate-600 mt-1 uppercase">
          {branchFilter === "all"
            ? "Enterprise Global (Consolidated)"
            : branches.find((b) => b.id.toString() === branchFilter.toString())
                ?.branch_name || "Branch Specific"}
        </p>
        <p className="text-[10px] font-mono tabular-nums font-bold text-slate-500 mt-1 uppercase tracking-widest">
          As of {formatDate(endDate)}
        </p>
      </div>

      {/* DATA TABLE */}
      <DataTable
        caption="Trial Balance Pre-Reporting Mathematical Parity Audit"
        headers={[
          "Account Code",
          "Account Name",
          "Account Type",
          "Debit Balance (₱)",
          "Credit Balance (₱)",
          "Action",
        ]}
        data={tableData}
        loading={loading}
        emptyTitle="No Accounts Found"
        emptySubtitle="Try adjusting your filters or search criteria."
        minWidth="min-w-[900px]"
        renderRow={(acc, idx) => {
          if (acc.is_total_row) {
            return (
              <tr
                key="grand-total"
                className="bg-slate-50 dark:bg-slate-900/80 border-t-4 border-double border-slate-900 dark:border-white print:bg-transparent print:border-black"
              >
                <td
                  colSpan={3}
                  className="px-4 sm:px-8 py-5 text-right whitespace-nowrap"
                >
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                    Grand Totals:
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">
                  <span className="text-sm sm:text-base font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    ₱{formatCurrency(acc.debit_balance)}
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">
                  <span className="text-sm sm:text-base font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    ₱{formatCurrency(acc.credit_balance)}
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5" />
              </tr>
            );
          }

          const debitBal = parseFloat(acc.debit_balance) || 0;
          const creditBal = parseFloat(acc.credit_balance) || 0;

          return (
            <tr
              key={`acc-${acc.id}-${idx}`}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0 print:hover:bg-transparent"
            >
              {/* Account Code */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-900/70 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-black font-mono tabular-nums tracking-wider print:bg-transparent print:border print:border-slate-400 print:text-black">
                  {acc.account_code}
                </span>
              </td>

              {/* Account Name */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[260px] print:text-black"
                  title={acc.account_name}
                >
                  {acc.account_name}
                </p>
              </td>

              {/* Account Type */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span
                  className={`inline-flex px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest print:bg-transparent print:border print:border-slate-400 print:text-black ${getTypeBadge(
                    acc.account_type,
                  )}`}
                >
                  {acc.account_type}
                </span>
              </td>

              {/* Debit Balance */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                {debitBal > 0 ? (
                  <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(debitBal)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 font-mono">
                    -
                  </span>
                )}
              </td>

              {/* Credit Balance */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                {creditBal > 0 ? (
                  <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(creditBal)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600 font-mono">
                    -
                  </span>
                )}
              </td>

              {/* Action */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.append("accountId", acc.id);
                    if (branchFilter && branchFilter !== "all") {
                      params.append("branch", branchFilter);
                    }
                    if (endDate) {
                      params.append("endDate", endDate);
                    }
                    navigate(
                      `/manager/accounting/general-ledger?${params.toString()}`,
                    );
                  }}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer print:hidden"
                  title={`View General Ledger for ${acc.account_code}`}
                  aria-label={`View general ledger for ${acc.account_code} ${acc.account_name}`}
                >
                  <Eye size={16} aria-hidden="true" />
                </button>
              </td>
            </tr>
          );
        }}
      />

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Audit Scope Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={branchFilterSelectId} className="form-label">
              Branch Isolation
            </label>
            <div className="relative">
              <select
                id={branchFilterSelectId}
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">Enterprise Global (Consolidated)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
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

          <div>
            <label htmlFor={typeFilterSelectId} className="form-label">
              Account Type
            </label>
            <div className="relative">
              <select
                id={typeFilterSelectId}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
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

          <div>
            <label htmlFor={cutoffDateInputId} className="form-label">
              As Of Date (Cutoff)
            </label>
            <input
              id={cutoffDateInputId}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input font-mono tabular-nums cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <label
              htmlFor={hideZeroCheckboxId}
              className="flex items-center gap-3 cursor-pointer group p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:border-amber-300 dark:hover:border-amber-500/40 select-none"
            >
              <input
                id={hideZeroCheckboxId}
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-amber-500 text-amber-500 focus:ring-amber-500 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-overdrive-yellow transition-colors">
                  Hide Zero Balances
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Excludes accounts with ₱0.00 debit/credit to keep the report
                  clean.
                </span>
              </div>
            </label>
          </div>
        </div>
      </FilterModal>
    </div>
  );
};

export default TrialBalance;
