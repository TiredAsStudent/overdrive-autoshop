import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  ReceiptText,
  Plus,
  FileSearch,
  Edit2,
  ArrowUpRight,
} from "lucide-react";
import { expenseService } from "../../services/staff/expense.service";
import ExpenseModal from "../../features/staff/components/ExpenseModal";
import ExpenseDrawer from "../../features/staff/components/ExpenseDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const Expenses = () => {
  const { showToast } = useApp();

  const [searchParams] = useSearchParams();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE");
  const [selectedExpenseData, setSelectedExpenseData] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "info",
    onConfirm: () => {},
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseService.getExpenses(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
        "all",
      );
      setExpenses(response.data?.expenses || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      if (modalMode === "CREATE") {
        const res = await expenseService.createExpense(formData);
        showToast(
          res.data.status === "PENDING_APPROVAL"
            ? "Expense submitted for approval."
            : "Draft expense created.",
          "success",
        );
      } else {
        await expenseService.updateExpense(selectedExpenseData.id, formData);
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
              Expenses
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Branch Cost Registry
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "draft", label: "Draft" },
              { id: "pending_approval", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search Ref or Desc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setModalMode("CREATE");
              setSelectedExpenseData(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Doc Ref",
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
              <div className="flex flex-col items-start gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">
                  {expense.expense_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col items-start gap-1 max-w-[200px]">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                  {expense.description}
                </p>
                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                  {expense.category}
                </p>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
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
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  expense.status === "APPROVED"
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : expense.status === "REJECTED"
                      ? "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      : expense.status === "DRAFT"
                        ? "text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20"
                        : "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                }`}
              >
                {expense.status.replace("_", " ")}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => openDrawer(expense.id)}
                  title="View Details"
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
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
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDirectSubmitForApproval(expense)}
                      title="Submit to Manager"
                      className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl transition-colors cursor-pointer"
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

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialData={selectedExpenseData}
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
