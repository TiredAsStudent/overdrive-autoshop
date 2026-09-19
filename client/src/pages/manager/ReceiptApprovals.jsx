import React, { useState, useEffect } from "react";
import {
  Loader2,
  ScanLine,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ScanText,
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

const ReceiptApprovals = () => {
  const { showToast } = useApp();

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
  const ITEMS_PER_PAGE = 10;

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

  // Reset to page 1 when search, view, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, viewMode, branchFilter]);

  const loadReceipts = async () => {
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

      setReceipts(res.data?.receipts || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [currentPage, debouncedSearchQuery, viewMode, branchFilter]);

  // Defensive Fallback: If current page becomes empty after processing an item, fall back 1 page
  useEffect(() => {
    if (!loading && receipts.length === 0 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [receipts.length, loading, currentPage]);

  const resetFilters = () => {
    setBranchFilter("all");
    setIsFilterModalOpen(false);
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

  const getConfidenceVariant = (score) => {
    const num = parseFloat(score || 0);
    if (num >= 85) return "success";
    if (num >= 60) return "warning";
    return "danger";
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Receipt Approvals"
        subtitle="OCR Document Validation Governance"
        icon={ScanLine}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Ref or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={viewMode}
          onToggle={setViewMode}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "History", value: "HISTORY" },
          ]}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
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
            : "Adjust your search parameters."
        }
        renderRow={(receipt) => (
          <tr
            key={receipt.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase w-max">
                  {receipt.expense_number}
                </span>
                <span
                  className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"
                  title="Generated via OCR Receipt Scanner"
                >
                  <ScanText size={10} /> OCR
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {viewMode === "PENDING"
                  ? new Date(receipt.expense_date).toLocaleDateString()
                  : receipt.processed_at
                    ? new Date(receipt.processed_at).toLocaleString()
                    : "--"}
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {receipt.vendor_name || "Unregistered Vendor"}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[200px]">
                {receipt.category}
              </p>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[150px]">
                  {receipt.branch_name}
                </span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                  {viewMode === "PENDING"
                    ? `BY: ${receipt.created_by_name || "System"}`
                    : `BY: ${receipt.resolved_by_name || receipt.created_by_name || "System"}`}
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={`${receipt.confidence_score}%`}
                variant={getConfidenceVariant(receipt.confidence_score)}
              />
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                ₱
                {parseFloat(receipt.total_amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={receipt.status.replace("_", " ")}
                variant={getBadgeVariant(receipt.status)}
                icon={getBadgeIcon(receipt.status)}
              />
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedReceiptId(receipt.id);
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

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
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
