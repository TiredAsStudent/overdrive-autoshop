import React, { useState, useEffect, useCallback, useId } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Scale,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { stockAdjustmentService } from "../../services/manager/stockAdjustment.service";
import { inventoryService } from "../../services/manager/inventory.service";
import AdjustmentModal from "../../features/manager/components/AdjustmentModal";
import AdjustmentDrawer from "../../features/manager/components/AdjustmentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const ITEMS_PER_PAGE = 10;

const StockAdjustments = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
  const branchSelectId = useId();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState(
    () => searchParams.get("branch") || "all",
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const activeFilterCount = branchFilter !== "all" ? 1 : 0;

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockAdjustmentService.getRequests(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        branchFilter,
      );

      const fetchedRequests = response.data?.requests || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedRequests.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setRequests(fetchedRequests);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load stock adjustment requests.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchQuery,
    statusFilter,
    branchFilter,
    showToast,
  ]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleStatusToggle = (newStatus) => {
    setStatusFilter(newStatus);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBranchChange = (e) => {
    setBranchFilter(e.target.value);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleResolution = async (id, action, remarks) => {
    if (action === "APPROVE") {
      const res = await stockAdjustmentService.approveRequest(id, remarks);
      showToast(res.message, "success");
    } else {
      const res = await stockAdjustmentService.rejectRequest(id, remarks);
      showToast(res.message, "info");
    }
    setIsModalOpen(false);
    loadRequests();
  };

  const handleOpenView = (req) => {
    setSelectedRequest(req);
    if (req.status === "PENDING") {
      setIsModalOpen(true);
    } else {
      setIsDrawerOpen(true);
    }
  };

  const resetFilters = () => {
    setBranchFilter("all");
    if (currentPage !== 1) setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Adjustments"
        subtitle="Managerial Inbox & Resolution"
        icon={Scale}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search item or SKU..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusToggle}
          ariaLabel="Filter stock adjustment requests by status"
          options={STATUS_OPTIONS}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Stock Adjustment Requests and Managerial Resolution Queue"
        minWidth="min-w-[820px]"
        headers={[
          "Request Details",
          "Target Branch",
          "Variance Details",
          "Status",
          "Action",
        ]}
        data={requests}
        loading={loading}
        emptyTitle={`No ${statusFilter.toLowerCase()} requests found`}
        emptySubtitle="No stock adjustment requests match your current search or filter criteria."
        renderRow={(req) => {
          const isAdd = req.adjustment_type === "ADD";
          const isPending = req.status === "PENDING";

          return (
            <tr
              key={req.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Request Details */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                  <p
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate"
                    title={req.item_name}
                  >
                    {req.item_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {req.sku}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-slate-300 dark:text-slate-600"
                    >
                      •
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      By {req.requester_first_name} {req.requester_last_name}
                    </span>
                  </div>
                </div>
              </td>

              {/* Target Branch */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                  {req.branch_name}
                </span>
              </td>

              {/* Variance Details */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1.5">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-black tracking-widest uppercase border ${
                      isAdd
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20"
                        : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200/80 dark:border-red-500/20"
                    }`}
                  >
                    {isAdd ? (
                      <ArrowUpRight size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} aria-hidden="true" />
                    )}
                    <span>
                      {isAdd ? "+" : "-"}
                      {req.requested_quantity} {req.uom}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[160px]"
                    title={(req.reason || "").replace(/_/g, " ")}
                  >
                    {(req.reason || "").replace(/_/g, " ")}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={req.status}
                  variant={
                    req.status === "APPROVED"
                      ? "success"
                      : req.status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                  icon={
                    req.status === "APPROVED"
                      ? CheckCircle
                      : req.status === "REJECTED"
                        ? XCircle
                        : Clock
                  }
                />
              </td>

              {/* Action */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenView(req)}
                    title={
                      isPending
                        ? `Review Request for ${req.item_name}`
                        : `View Details for ${req.item_name}`
                    }
                    aria-label={
                      isPending
                        ? `Review pending stock adjustment request for ${req.item_name}`
                        : `View resolved stock adjustment details for ${req.item_name}`
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                  >
                    <Eye size={14} aria-hidden="true" />
                    <span>{isPending ? "Review" : "Details"}</span>
                  </button>
                </div>
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

      {/* UNIVERSAL FILTER MODAL */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={resetFilters}
        title="Advanced Filters"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor={branchSelectId} className="form-label">
              Branch Location
            </label>
            <div className="relative">
              <select
                id={branchSelectId}
                value={branchFilter}
                onChange={handleBranchChange}
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

      <AdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleResolution}
        request={selectedRequest}
      />
      <AdjustmentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default StockAdjustments;
