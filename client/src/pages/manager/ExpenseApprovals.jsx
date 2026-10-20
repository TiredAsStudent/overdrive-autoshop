import React, { useState, useEffect, useCallback, useId } from "react";
import {
  ReceiptText,
  Eye,
  ScanText,
  Paperclip,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { expenseApprovalService } from "../../services/manager/expenseApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import { chartOfAccountsService } from "../../services/manager/chartOfAccounts.service";

import ExpenseApprovalModal from "../../features/manager/components/ExpenseApprovalModal";
import ExpenseApprovalDrawer from "../../features/manager/components/ExpenseApprovalDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusToggle from "../../components/ui/StatusToggle";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const VIEW_MODE_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "History", value: "HISTORY" },
];

const ITEMS_PER_PAGE = 10;

const ExpenseApprovals = () => {
  const { showToast } = useApp();

  // Accessible Filter IDs
  const categoryFilterSelectId = useId();
  const branchFilterSelectId = useId();

  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'PENDING' | 'HISTORY'
  const [viewMode, setViewMode] = useState("PENDING");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [expenseAccountIdFilter, setExpenseAccountIdFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // UI View States
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) +
    (expenseAccountIdFilter !== "all" ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));

    chartOfAccountsService
      .getAccounts(1, 500, "", "EXPENSE", "active")
      .then((res) => setExpenseCategories(res.data?.accounts || res.data || []))
      .catch((err) => console.error("Failed to load COA categories", err));
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res =
        viewMode === "PENDING"
          ? await expenseApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              expenseAccountIdFilter,
              branchFilter,
            )
          : await expenseApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              expenseAccountIdFilter,
              branchFilter,
            );

      const fetchedExpenses = res.data?.expenses || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedExpenses.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setExpenses(fetchedExpenses);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load expense approval records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    viewMode,
    branchFilter,
    expenseAccountIdFilter,
    showToast,
  ]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    setExpenseAccountIdFilter(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchFilterChange = (e) => {
    setBranchFilter(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleOpenView = (expense) => {
    setSelectedExpenseId(expense.id);
    if (expense.status === "PENDING_APPROVAL") {
      setIsModalOpen(true);
    } else {
      setIsDrawerOpen(true);
    }
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "danger";
      default:
        return "default";
    }
  };

  const getBadgeIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return CheckCircle;
      case "PENDING_APPROVAL":
        return Clock;
      case "REJECTED":
        return XCircle;
      default:
        return FileText;
    }
  };

  const resetFilters = () => {
    setBranchFilter("all");
    setExpenseAccountIdFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Expense Approvals"
        subtitle="Operational Expense Governance"
        icon={ReceiptText}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Document..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={viewMode}
          onToggle={handleViewModeToggle}
          ariaLabel="Toggle between pending expense approvals and approval history"
          options={VIEW_MODE_OPTIONS}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Operational Expense Governance and Approval Queue"
        minWidth="min-w-[900px]"
        headers={[
          "Expense No.",
          viewMode === "PENDING" ? "Expense Date" : "Date Processed",
          "Particulars",
          viewMode === "PENDING" ? "Branch & Staff" : "Branch & Decision",
          "Total Amount",
          viewMode === "PENDING" ? "Status" : "Decision",
          "Actions",
        ]}
        data={expenses}
        loading={loading}
        emptyTitle={
          viewMode === "PENDING"
            ? "No Pending Approvals"
            : "No Historical Records Found"
        }
        emptySubtitle={
          viewMode === "PENDING"
            ? "Your expense review queue is completely clear."
            : "Adjust your search parameters or filter criteria."
        }
        renderRow={(expense) => {
          const processedDate =
            expense.processed_at || expense.resolved_at || expense.updated_at;
          const isPending = expense.status === "PENDING_APPROVAL";

          return (
            <tr
              key={expense.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Expense No. */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase w-max">
                    {expense.expense_number}
                  </span>
                  {expense.scan_id ? (
                    <span
                      className="bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1"
                      title="Generated via OCR Receipt Scanner"
                    >
                      <ScanText size={10} aria-hidden="true" />
                      <span>OCR</span>
                    </span>
                  ) : expense.receipt_url ? (
                    <Paperclip
                      size={14}
                      aria-label="Receipt attachment present"
                      className="text-amber-500 dark:text-overdrive-yellow shrink-0"
                      title="Attachment Present"
                    />
                  ) : null}
                </div>
              </td>

              {/* Expense Date / Date Processed */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300">
                  {viewMode === "PENDING"
                    ? formatDate(expense.expense_date)
                    : formatDateTime(processedDate)}
                </p>
              </td>

              {/* Particulars */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[220px]"
                  title={expense.category}
                >
                  {expense.category}
                </p>
                <p
                  className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5 truncate max-w-[220px]"
                  title={expense.vendor_name || expense.description}
                >
                  {expense.vendor_name || expense.description}
                </p>
              </td>

              {/* Branch & Staff / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[160px]"
                    title={expense.branch_name}
                  >
                    {expense.branch_name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[160px]">
                    {viewMode === "PENDING"
                      ? `BY: ${expense.created_by_name || "System"}`
                      : `BY: ${expense.resolved_by_name || expense.created_by_name || "System"}`}
                  </span>
                </div>
              </td>

              {/* Total Amount */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  ₱{formatCurrency(expense.total_amount)}
                </span>
              </td>

              {/* Status / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={(expense.status || "").replace(/_/g, " ")}
                  variant={getBadgeVariant(expense.status)}
                  icon={getBadgeIcon(expense.status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleOpenView(expense)}
                  title={
                    isPending
                      ? `Review Expense ${expense.expense_number}`
                      : `View Expense ${expense.expense_number}`
                  }
                  aria-label={
                    isPending
                      ? `Review pending expense request ${expense.expense_number}`
                      : `View details for expense ${expense.expense_number}`
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                >
                  <Eye size={14} aria-hidden="true" />
                  <span>{isPending ? "Review" : "Details"}</span>
                </button>
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={categoryFilterSelectId} className="form-label">
              COA Expense Category
            </label>
            <div className="relative">
              <select
                id={categoryFilterSelectId}
                value={expenseAccountIdFilter}
                onChange={handleCategoryFilterChange}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.account_name}
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
            <label htmlFor={branchFilterSelectId} className="form-label">
              Branch Location
            </label>
            <div className="relative">
              <select
                id={branchFilterSelectId}
                value={branchFilter}
                onChange={handleBranchFilterChange}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Branches</option>
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
        </div>
      </FilterModal>

      <ExpenseApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenseId={selectedExpenseId}
        onSuccess={loadExpenses}
      />

      <ExpenseApprovalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        expenseId={selectedExpenseId}
      />
    </div>
  );
};

export default ExpenseApprovals;
