import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Eye,
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
    (hideZero ? 1 : 0);

  // Initial Load: Branches
  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => console.error("Failed to fetch branches."));
  }, []);

  // Fetch Trial Balance Data
  const loadTrialBalance = async () => {
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
      showToast(error.message, "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, typeFilter, branchFilter, endDate, hideZero]);

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

  // Inject a Grand Total row for the DataTable
  const tableData = data ? [...data.accounts] : [];
  if (data && tableData.length > 0) {
    tableData.push({
      is_total_row: true,
      debit_balance: data.summary.total_debits,
      credit_balance: data.summary.total_credits,
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
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
      {data && (
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
            : branches.find((b) => b.id.toString() === branchFilter)
                ?.branch_name || "Branch Specific"}
        </p>
        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
          As of{" "}
          {endDate
            ? new Date(endDate).toLocaleDateString()
            : new Date().toLocaleDateString()}
        </p>
      </div>

      {/* DATA TABLE */}
      <DataTable
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
                <td colSpan={3} className="px-4 sm:px-8 py-5 text-right">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                    Grand Totals:
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5 text-right">
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(acc.debit_balance)}
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5 text-right">
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(acc.credit_balance)}
                  </span>
                </td>
                <td className="px-4 sm:px-8 py-5"></td>
              </tr>
            );
          }

          return (
            <tr
              key={`acc-${acc.id}-${idx}`}
              className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
            >
              <td className="px-4 sm:px-8 py-4">
                <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-800 dark:text-slate-300 font-mono tracking-wider print:bg-transparent print:border print:border-slate-400 print:text-black">
                  {acc.account_code}
                </span>
              </td>

              <td className="px-4 sm:px-8 py-4">
                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[250px] print:text-black">
                  {acc.account_name}
                </p>
              </td>

              <td className="px-4 sm:px-8 py-4">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest print:bg-transparent print:border print:border-slate-400 print:text-black ${getTypeBadge(acc.account_type)}`}
                >
                  {acc.account_type}
                </span>
              </td>

              <td className="px-4 sm:px-8 py-4 text-right">
                {parseFloat(acc.debit_balance) > 0 ? (
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(acc.debit_balance)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-700">-</span>
                )}
              </td>

              <td className="px-4 sm:px-8 py-4 text-right">
                {parseFloat(acc.credit_balance) > 0 ? (
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white print:text-black">
                    {formatCurrency(acc.credit_balance)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-700">-</span>
                )}
              </td>

              <td className="px-4 sm:px-8 py-4 text-right">
                <button
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
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer print:hidden"
                  title="View Account Ledger"
                >
                  <Eye size={16} />
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Branch Isolation
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">Enterprise Global (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Account Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All Classifications" : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              As Of Date (Cutoff)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:border-amber-300">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-amber-500 transition-colors">
                  Hide Zero Balances
                </span>
                <span className="text-[9px] text-slate-400 leading-tight mt-0.5">
                  Excludes inactive accounts with ₱0.00 debit/credit to keep the
                  report clean.
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
