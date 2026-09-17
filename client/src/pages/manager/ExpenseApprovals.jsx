import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ReceiptText,
  Eye,
  ScanText,
  Paperclip,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";
import { expenseApprovalService } from "../../services/manager/expenseApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import ExpenseApprovalDrawer from "../../features/manager/components/ExpenseApprovalDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import StatusToggle from "../../components/ui/StatusToggle";

const EXPENSE_CATEGORIES = [
  "Utility Expense",
  "Parts & Supplies Expense",
  "Equipment Maintenance",
  "Uncategorized Expense",
  "Rent Expense",
  "Transportation Expense",
  "Meals & Entertainment",
  "Office Supplies",
];

const ExpenseApprovals = () => {
  const { showToast } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'PENDING' | 'HISTORY'
  const [viewMode, setViewMode] = useState("PENDING");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Drawer State
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount =
    (branchFilter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, viewMode, branchFilter, categoryFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const res =
        viewMode === "PENDING"
          ? await expenseApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              categoryFilter,
              branchFilter,
            )
          : await expenseApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              categoryFilter,
              branchFilter,
            );

      setExpenses(res.data?.expenses || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [
    currentPage,
    debouncedSearchQuery,
    viewMode,
    branchFilter,
    categoryFilter,
  ]);

  useEffect(() => {
    if (!loading && expenses.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [expenses.length, loading, currentPage]);

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
    setCategoryFilter("all");
    setIsFilterModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <ReceiptText className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Expense Approvals
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Operational Expense Governance
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Tab Toggle */}
          <StatusToggle
            activeValue={viewMode}
            onToggle={setViewMode}
            options={[
              { label: "Pending", value: "PENDING" },
              { label: "History", value: "HISTORY" },
            ]}
          />

          <FilterButton
            onClick={() => setIsFilterModalOpen(true)}
            activeCount={activeFilterCount}
          />

          {/* Search Bar */}
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
              placeholder="Search Document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
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
            : "Adjust your search parameters."
        }
        renderRow={(expense) => (
          <tr
            key={expense.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase w-max">
                  {expense.expense_number}
                </span>
                {expense.scan_id ? (
                  <span
                    className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"
                    title="Generated via OCR Receipt Scanner"
                  >
                    <ScanText size={10} /> OCR
                  </span>
                ) : expense.receipt_url ? (
                  <Paperclip
                    size={14}
                    className="text-amber-500"
                    title="Attachment Present"
                  />
                ) : null}
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {viewMode === "PENDING"
                  ? new Date(expense.expense_date).toLocaleDateString()
                  : new Date(expense.processed_at).toLocaleString()}
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {expense.category}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[200px]">
                {expense.vendor_name || expense.description}
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[150px]">
                  {expense.branch_name}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                  {viewMode === "PENDING"
                    ? `BY: ${expense.created_by_name || "System"}`
                    : `BY: ${expense.resolved_by_name || expense.created_by_name || "System"}`}
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                ₱
                {parseFloat(expense.total_amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={expense.status.replace("_", " ")}
                variant={getBadgeVariant(expense.status)}
                icon={getBadgeIcon(expense.status)}
              />
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedExpenseId(expense.id);
                  setIsDrawerOpen(true);
                }}
                title={
                  viewMode === "PENDING" ? "Review Request" : "View Details"
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                <Eye size={14} />
                {viewMode === "PENDING" ? "Review" : "Details"}
              </button>
            </td>
          </tr>
        )}
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Expense Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Branch Location
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterModal>

      <ExpenseApprovalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        expenseId={selectedExpenseId}
        onSuccess={loadExpenses}
      />
    </div>
  );
};

export default ExpenseApprovals;
