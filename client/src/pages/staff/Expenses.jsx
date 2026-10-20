import React, { useState, useEffect, useCallback, useId } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ReceiptText,
  Plus,
  FileSearch,
  Edit2,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Paperclip,
  ScanText,
  ChevronDown,
} from "lucide-react";
import { expenseService } from "../../services/staff/expense.service";
import ExpenseModal from "../../features/staff/components/ExpenseModal";
import ExpenseDrawer from "../../features/staff/components/ExpenseDrawer";

// Reusable Shared Components
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import FilterButton from "../../components/ui/FilterButton";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterModal from "../../components/shared/FilterModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const ITEMS_PER_PAGE = 10;

const Expenses = () => {
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilterSelectId = useId();

  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expenseAccountIdFilter, setExpenseAccountIdFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [selectedExpenseData, setSelectedExpenseData] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "info",
    onConfirm: () => {},
  });

  const activeFilterCount = expenseAccountIdFilter !== "all" ? 1 : 0;

  useEffect(() => {
    expenseService
      .getActiveCategories()
      .then((res) => setExpenseCategories(res.data || []))
      .catch((err) => console.error("Failed to load COA categories", err));
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    if (!val) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ search: val }, { replace: true });
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleAccountFilterChange = (value) => {
    setExpenseAccountIdFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenses(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        expenseAccountIdFilter,
        "all",
      );

      const fetchedExpenses = response.data?.expenses || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedExpenses.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setExpenses(fetchedExpenses);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load expense records.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    statusFilter,
    expenseAccountIdFilter,
    showToast,
  ]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleModalSubmit = async (formData, attachmentFile) => {
    if (modalMode === "CREATE") {
      const res = await expenseService.createExpense(formData, attachmentFile);
      showToast(
        res.data.status === "PENDING_APPROVAL"
          ? "Expense submitted for approval."
          : "Draft expense created.",
        "success",
      );
    } else {
      await expenseService.updateExpense(
        selectedExpenseData.id,
        formData,
        attachmentFile,
      );
      showToast("Expense updated successfully.", "success");
    }
    setIsModalOpen(false);
    setSelectedExpenseData(null);
    loadExpenses();
  };

  const handleDirectSubmitForApproval = (expense) => {
    setConfirmConfig({
      isOpen: true,
      title: "Submit Expense for Approval",
      message: `Are you sure you want to submit ${expense.expense_number} to the Manager? It will be locked from further edits until a decision is made.`,
      confirmText: "Yes, Submit Now",
      variant: "info",
      onConfirm: async () => {
        try {
          await expenseService.updateStatus(expense.id, "PENDING_APPROVAL");
          showToast("Expense successfully submitted for review.", "success");
          loadExpenses();
        } catch (error) {
          showToast(
            error.message || "Failed to submit expense for approval.",
            "error",
          );
        }
      },
    });
  };

  const openDrawer = (id) => {
    setSelectedExpenseId(id);
    setIsDrawerOpen(true);
  };

  const resetFilters = () => {
    setExpenseAccountIdFilter("all");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    setIsFilterModalOpen(false);
  };

  const getStatusBadgeVariant = (status) => {
    if (status === "APPROVED") return "success";
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "REJECTED") return "danger";
    return "default";
  };

  const getStatusBadgeIcon = (status) => {
    if (status === "APPROVED") return CheckCircle;
    if (status === "PENDING_APPROVAL") return Clock;
    if (status === "REJECTED") return XCircle;
    return FileText;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const emptyStatusLabel =
    statusFilter !== "all"
      ? `${statusFilter.replace(/_/g, " ").toLowerCase()} `
      : "";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Expenses"
        subtitle="Branch Cost Registry"
        icon={ReceiptText}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter expenses by approval status"
          options={STATUS_FILTERS}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Expense No. or Desc..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <ActionButton
          onClick={() => {
            setModalMode("CREATE");
            setSelectedExpenseData(null);
            setIsModalOpen(true);
          }}
          label="Record Expense"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        caption="Branch Operational Expenses Registry"
        minWidth="min-w-[860px]"
        headers={[
          "Expense No.",
          "Particulars",
          "Payee",
          "Amount",
          "Status",
          "Actions",
        ]}
        data={expenses}
        loading={loading}
        emptyTitle={`No ${emptyStatusLabel}expenses found`}
        emptySubtitle="Try adjusting your search or filter criteria, or record a new branch expense."
        renderRow={(expense) => (
          <tr
            key={expense.id}
            className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
          >
            {/* Expense No. & Date */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 align-top sm:align-middle whitespace-nowrap">
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                    {expense.expense_number}
                  </span>
                  {/* Visual Evidence Indicators */}
                  {expense.scan_id ? (
                    <span
                      className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0"
                      title="Generated via OCR Receipt Scanner"
                    >
                      <ScanText size={10} aria-hidden="true" />
                      <span>OCR</span>
                    </span>
                  ) : expense.receipt_url ? (
                    <span
                      title="Attachment Present"
                      aria-label="Attachment Present"
                      className="inline-flex text-amber-500 dark:text-overdrive-yellow shrink-0"
                    >
                      <Paperclip size={14} aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                  {formatDate(expense.expense_date)}
                </span>
              </div>
            </td>

            {/* Particulars */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 align-top sm:align-middle">
              <div className="flex flex-col items-start gap-1 min-w-[180px] max-w-[220px] sm:max-w-[280px] whitespace-normal">
                <p
                  className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2"
                  title={expense.description}
                >
                  {expense.description}
                </p>
                <p
                  className="text-[10px] font-black text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest mt-0.5 truncate max-w-full"
                  title={expense.category}
                >
                  {expense.category}
                </p>
              </div>
            </td>

            {/* Payee */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 align-top sm:align-middle whitespace-nowrap">
              <p
                className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate max-w-[160px]"
                title={expense.vendor_name || "N/A"}
              >
                {expense.vendor_name || "N/A"}
              </p>
            </td>

            {/* Amount */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 align-top sm:align-middle whitespace-nowrap">
              <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white block">
                ₱{formatCurrency(expense.total_amount)}
              </span>
            </td>

            {/* Status */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 align-top sm:align-middle whitespace-nowrap">
              <StatusBadge
                label={
                  expense.status ? expense.status.replace(/_/g, " ") : "DRAFT"
                }
                variant={getStatusBadgeVariant(expense.status)}
                icon={getStatusBadgeIcon(expense.status)}
              />
            </td>

            {/* Actions */}
            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-right align-top sm:align-middle whitespace-nowrap">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(expense.id)}
                  title={`View ${expense.expense_number} Details`}
                  aria-label={`View details for ${expense.expense_number}`}
                  className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <FileSearch size={16} aria-hidden="true" />
                </button>

                {(expense.status === "DRAFT" ||
                  expense.status === "REJECTED") && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setModalMode("EDIT");
                        setSelectedExpenseData(expense);
                        setIsModalOpen(true);
                      }}
                      title={`Edit ${expense.expense_number}`}
                      aria-label={`Edit expense ${expense.expense_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectSubmitForApproval(expense)}
                      title={`Submit ${expense.expense_number} to Manager`}
                      aria-label={`Submit ${expense.expense_number} to Manager for approval`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  </>
                )}
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={categoryFilterSelectId} className="form-label">
              Filter by COA Category
            </label>
            <div className="relative">
              <select
                id={categoryFilterSelectId}
                value={expenseAccountIdFilter}
                onChange={(e) => handleAccountFilterChange(e.target.value)}
                className="form-select appearance-none pr-10 cursor-pointer"
              >
                <option value="all">All Expense Accounts</option>
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
        </div>
      </FilterModal>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpenseData(null);
        }}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={selectedExpenseData}
        categories={expenseCategories}
      />
      <ExpenseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        expenseId={selectedExpenseId}
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

export default Expenses;
