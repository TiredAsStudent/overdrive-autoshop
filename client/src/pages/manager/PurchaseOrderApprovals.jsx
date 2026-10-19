import React, { useState, useEffect, useCallback, useId } from "react";
import {
  ClipboardCheck,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { poApprovalService } from "../../services/manager/poApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import POApprovalModal from "../../features/manager/components/POApprovalModal";
import PurchaseOrderApprovalDrawer from "../../features/manager/components/POApprovalDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import FilterButton from "../../components/ui/FilterButton";
import FilterModal from "../../components/shared/FilterModal";
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const VIEW_MODE_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "History", value: "HISTORY" },
];

const ITEMS_PER_PAGE = 10;

const PurchaseOrderApprovals = () => {
  const { showToast } = useApp();
  const branchFilterSelectId = useId();

  const [orders, setOrders] = useState([]);
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

  // View States
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res =
        viewMode === "PENDING"
          ? await poApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              branchFilter,
            )
          : await poApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              branchFilter,
            );

      const fetchedOrders = res.data?.purchaseOrders || [];
      const fetchedTotalPages = res.data?.pagination?.totalPages || 1;

      if (fetchedOrders.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setOrders(fetchedOrders);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load purchase order approval records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, viewMode, branchFilter, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenView = (order) => {
    setSelectedOrderId(order.id);
    if (order.status === "PENDING_APPROVAL" || viewMode === "PENDING") {
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
    if (status === "APPROVED") return CheckCircle;
    if (status === "REJECTED") return XCircle;
    return Clock;
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
        title="Purchase Order Approvals"
        subtitle="Managerial Procurement Oversight"
        icon={ClipboardCheck}
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search PO or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={viewMode}
          onToggle={handleViewModeToggle}
          ariaLabel="Toggle between pending purchase order approvals and approval history"
          options={VIEW_MODE_OPTIONS}
        />
      </PageHeader>

      <DataTable
        caption="Managerial Purchase Order Approvals and Procurement Queue"
        minWidth="min-w-[850px]"
        headers={
          viewMode === "PENDING"
            ? [
                "PO Number",
                "Purchase Date",
                "Vendor",
                "Branch & Staff",
                "Total Amount",
                "Status",
                "Actions",
              ]
            : [
                "PO Number",
                "Date Processed",
                "Vendor",
                "Branch & Decision",
                "Total Amount",
                "Decision",
                "Actions",
              ]
        }
        data={orders}
        loading={loading}
        emptyTitle={
          viewMode === "PENDING"
            ? "No Pending Approvals"
            : "No Historical Records Found"
        }
        emptySubtitle={
          viewMode === "PENDING"
            ? "Your review queue is completely clear."
            : "Adjust your search parameters or filter criteria."
        }
        renderRow={(order) => {
          const processedDate =
            order.processed_at || order.resolved_at || order.updated_at;
          const isPending =
            order.status === "PENDING_APPROVAL" || viewMode === "PENDING";

          return (
            <tr
              key={order.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* PO Number */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase w-max">
                  {order.purchase_order_number}
                </span>
              </td>

              {/* Purchase Date / Date Processed */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-300">
                  {viewMode === "PENDING"
                    ? formatDate(order.created_at)
                    : formatDateTime(processedDate)}
                </p>
              </td>

              {/* Vendor */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[180px] sm:max-w-[220px]"
                  title={order.vendor_name}
                >
                  {order.vendor_name}
                </p>
              </td>

              {/* Branch & Staff / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-0.5">
                  <span
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[160px]"
                    title={order.branch_name}
                  >
                    {order.branch_name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[160px]">
                    {viewMode === "PENDING"
                      ? `BY: ${order.created_by_name || "System"}`
                      : `BY: ${order.resolved_by_name || order.created_by_name || "System"}`}
                  </span>
                </div>
              </td>

              {/* Total Amount */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums">
                  ₱{formatCurrency(order.grand_total)}
                </span>
              </td>

              {/* Status / Decision */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={(order.status || "").replace(/_/g, " ")}
                  variant={getBadgeVariant(order.status)}
                  icon={getBadgeIcon(order.status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleOpenView(order)}
                  title={
                    isPending
                      ? `Review Purchase Order ${order.purchase_order_number}`
                      : `View Purchase Order ${order.purchase_order_number}`
                  }
                  aria-label={
                    isPending
                      ? `Review pending purchase order ${order.purchase_order_number}`
                      : `View details for purchase order ${order.purchase_order_number}`
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

      <POApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        poId={selectedOrderId}
        onSuccess={loadOrders}
      />

      <PurchaseOrderApprovalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        poId={selectedOrderId}
      />
    </div>
  );
};

export default PurchaseOrderApprovals;
