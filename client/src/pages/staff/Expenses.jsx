import React, { useState, useEffect, useCallback } from "react";
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

const Expenses = () => {
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expenseAccountIdFilter, setExpenseAccountIdFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    if (!val) {
      setSearchParams({});
    } else {
      setSearchParams({ search: val });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, expenseAccountIdFilter]);

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
      setExpenses(response.data?.expenses || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
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
    try {
      if (modalMode === "CREATE") {
        const res = await expenseService.createExpense(
          formData,
          attachmentFile,
        );
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
      loadExpenses();
    } catch (error) {
      throw error;
    }
  };

  const handleDirectSubmitForApproval = (expense) => {
    setConfirmConfig({
      isOpen: true,
      title: `Submit Expense for Approval`,
      message: `Are you sure you want to submit ${expense.expense_number} to the Manager? It will be locked from further edits until a decision is made.`,
      confirmText: `Yes, Submit Now`,
      variant: "info",
      onConfirm: async () => {
        try {
          await expenseService.updateStatus(expense.id, "PENDING_APPROVAL");
          showToast(`Expense successfully submitted for review.`, "success");
          loadExpenses();
        } catch (error) {
          showToast(error.message, "error");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Expenses"
        subtitle="Branch Cost Registry"
        icon={ReceiptText}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={STATUS_FILTERS}
          className="overflow-x-auto custom-scrollbar"
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
        emptyTitle={`No ${statusFilter !== "all" ? statusFilter.toLowerCase() : ""} expenses found`}
        renderRow={(expense) => (
          <tr
            key={expense.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1 w-max">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                    {expense.expense_number}
                  </span>
                  {/* Visual Evidence Indicators */}
                  {expense.scan_id ? (
                    <span
                      className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0"
                      title="Generated via OCR Receipt Scanner"
                    >
                      <ScanText size={10} /> OCR
                    </span>
                  ) : expense.receipt_url ? (
                    <Paperclip
                      size={14}
                      className="text-amber-500 shrink-0"
                      title="Attachment Present"
                    />
                  ) : null}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1 max-w-[150px] sm:max-w-[200px]">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                  {expense.description}
                </p>
                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest truncate">
                  {expense.category}
                </p>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest truncate max-w-[120px] sm:max-w-[150px]">
                {expense.vendor_name || "N/A"}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                ₱
                {parseFloat(expense.total_amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 w-max">
              <StatusBadge
                label={expense.status.replace("_", " ")}
                variant={getStatusBadgeVariant(expense.status)}
                icon={getStatusBadgeIcon(expense.status)}
              />
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <button
                  onClick={() => openDrawer(expense.id)}
                  title="View Details"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <FileSearch size={16} />
                </button>

                {(expense.status === "DRAFT" ||
                  expense.status === "REJECTED") && (
                  <>
                    <button
                      onClick={() => {
                        setModalMode("EDIT");
                        setSelectedExpenseData(expense);
                        setIsModalOpen(true);
                      }}
                      title="Edit Expense"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDirectSubmitForApproval(expense)}
                      title="Submit to Manager"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowUpRight size={16} />
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
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Filter by COA Category
            </label>
            <select
              value={expenseAccountIdFilter}
              onChange={(e) => setExpenseAccountIdFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Expense Accounts</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.account_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterModal>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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

export default Expenses;
