import React, { useState, useEffect } from "react";
import { Loader2, ScanLine, FileSearch } from "lucide-react";
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
          "Vendor & Category",
          viewMode === "PENDING" ? "Expense Date" : "Processed At",
          "AI Accuracy",
          "Total Amount",
          "Status",
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
              <div className="flex flex-col gap-1 text-left">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase w-max">
                  {receipt.expense_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                  {receipt.branch_name}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {receipt.vendor_name || "Unregistered Vendor"}
              </p>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase mt-0.5 truncate max-w-[200px]">
                {receipt.category}
              </p>
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
              />
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedReceiptId(receipt.id);
                  setIsDrawerOpen(true);
                }}
                title={
                  viewMode === "PENDING" ? "Review & Decide" : "View Details"
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                  viewMode === "PENDING"
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <FileSearch size={14} />
                {viewMode === "PENDING" ? "Review" : "View"}
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
