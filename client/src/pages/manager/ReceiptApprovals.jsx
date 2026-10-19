import React, { useState, useEffect, useCallback, useId } from "react";
import {
  ScanLine,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { receiptApprovalService } from "../../services/manager/receiptApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import ReceiptApprovalDrawer from "../../features/manager/components/ReceiptApprovalDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";
import FilterModal from "../../components/shared/FilterModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const VIEW_MODE_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "History", value: "HISTORY" },
];

const ITEMS_PER_PAGE = 10;

const ReceiptApprovals = () => {
  const { showToast } = useApp();
  const branchFilterSelectId = useId();

  const [receipts, setReceipts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'PENDING' | 'HISTORY'
  const [viewMode, setViewMode] = useState("PENDING");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer State
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount = branchFilter !== "all" ? 1 : 0;

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleViewModeToggle = (mode) => {
    setViewMode(mode);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchFilterChange = (value) => {
    setBranchFilter(value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const resetFilters = () => {
    setBranchFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const res =
        viewMode === "PENDING"
          ? await receiptApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              branchFilter,
            )
          : await receiptApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              branchFilter,
            );

      const fetchedReceipts = res.data?.receipts || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedReceipts.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setReceipts(fetchedReceipts);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load OCR receipt approval records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, viewMode, branchFilter, showToast]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

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

  const getConfidenceVariant = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85) return "success";
    if (num >= 60) return "warning";
    return "danger";
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
    if (!dateString) return "--";
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
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Approvals"
        subtitle="OCR Document Validation Governance"
        icon={ScanLine}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Ref or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={viewMode}
          onToggle={handleViewModeToggle}
          ariaLabel="Toggle between pending receipt approvals and approval history"
          options={VIEW_MODE_OPTIONS}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="OCR Receipt Validation and Expense Approval Queue"
        minWidth="min-w-[920px]"
        headers={[
          "Document Ref",
          viewMode === "PENDING" ? "Expense Date" : "Date Processed",
          "Vendor & Category",
          viewMode === "PENDING" ? "Branch & Staff" : "Branch & Decision",
          "AI Accuracy",
          "Total Amount",
          viewMode === "PENDING" ? "Status" : "Decision",
          "Actions",
        ]}
        data={receipts}
        loading={loading}
        emptyTitle={
          viewMode === "PENDING"
            ? "No Pending Receipt Approvals"
            : "No Historical Receipts Found"
        }
        emptySubtitle={
          viewMode === "PENDING"
            ? "Your OCR receipt validation queue is clear."
            : "Adjust your search parameters or filter criteria."
        }
        renderRow={(receipt) => {
          const processedDate =
            receipt.processed_at || receipt.resolved_at || receipt.updated_at;
          const isPending =
            receipt.status === "PENDING_APPROVAL" || viewMode === "PENDING";

          return (
            <tr
              key={receipt.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Document Ref */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase w-max">
                  {receipt.expense_number}
                </span>
              </td>

              {/* Expense Date / Date Processed */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300">
                  {viewMode === "PENDING"
                    ? formatDate(receipt.expense_date)
                    : formatDateTime(processedDate)}
                </p>
              </td>

              {/* Vendor & Category */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]"
                  title={receipt.vendor_name || "Unregistered Vendor"}
                >
                  {receipt.vendor_name || "Unregistered Vendor"}
                </p>
                <p
                  className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5 truncate max-w-[200px]"
                  title={receipt.category}
                >
                  {receipt.category}
                </p>
              </td>

              {/* Branch & Staff / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[160px]"
                    title={receipt.branch_name}
                  >
                    {receipt.branch_name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[160px]">
                    {viewMode === "PENDING"
                      ? `BY: ${receipt.created_by_name || "System"}`
                      : `BY: ${receipt.resolved_by_name || receipt.created_by_name || "System"}`}
                  </span>
                </div>
              </td>

              {/* AI Accuracy */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={`${receipt.confidence_score ?? 0}%`}
                  variant={getConfidenceVariant(receipt.confidence_score)}
                  className="font-mono tabular-nums"
                />
              </td>

              {/* Total Amount */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  ₱{formatCurrency(receipt.total_amount)}
                </span>
              </td>

              {/* Status / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={(receipt.status || "").replace(/_/g, " ")}
                  variant={getBadgeVariant(receipt.status)}
                  icon={getBadgeIcon(receipt.status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReceiptId(receipt.id);
                    setIsDrawerOpen(true);
                  }}
                  title={
                    isPending
                      ? `Review OCR Receipt ${receipt.expense_number}`
                      : `View OCR Receipt ${receipt.expense_number}`
                  }
                  aria-label={
                    isPending
                      ? `Review pending OCR receipt ${receipt.expense_number}`
                      : `View details for OCR receipt ${receipt.expense_number}`
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

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={branchFilterSelectId} className="form-label">
              Branch Location
            </label>
            <div className="relative">
              <select
                id={branchFilterSelectId}
                value={branchFilter}
                onChange={(e) => handleBranchFilterChange(e.target.value)}
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

      <ReceiptApprovalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        receiptId={selectedReceiptId}
        onSuccess={loadReceipts}
      />
    </div>
  );
};

export default ReceiptApprovals;
