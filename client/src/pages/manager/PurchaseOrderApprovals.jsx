import React, { useState, useEffect } from "react";
import { ClipboardCheck, FileSearch } from "lucide-react";
import { poApprovalService } from "../../services/manager/poApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import { vendorService } from "../../services/staff/vendor.service";
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

const PurchaseOrderApprovals = () => {
  const { showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vendorList, setVendorList] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'PENDING' | 'HISTORY'
  const [viewMode, setViewMode] = useState("PENDING");

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [branchFilter, setBranchFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempVendorFilter, setTempVendorFilter] = useState("all");
  const [activeVendorFilter, setActiveVendorFilter] = useState("all");

  // Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeFilterCount = activeVendorFilter !== "all" ? 1 : 0;

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));

    vendorService
      .getVendors(1, 500, "", "active", "all", "all")
      .then((res) => setVendorList(res.data?.vendors || []))
      .catch((err) => console.error("Failed to load vendors", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, viewMode, branchFilter, activeVendorFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res =
        viewMode === "PENDING"
          ? await poApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              activeVendorFilter,
              branchFilter,
            )
          : await poApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              activeVendorFilter,
              branchFilter,
            );

      setOrders(res.data?.purchaseOrders || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    currentPage,
    debouncedSearchQuery,
    viewMode,
    branchFilter,
    activeVendorFilter,
  ]);

  const applyFilters = () => {
    setActiveVendorFilter(tempVendorFilter);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempVendorFilter("all");
    setActiveVendorFilter("all");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      <PageHeader
        title="Purchase Order Approvals"
        subtitle="Managerial Procurement Oversight"
        icon={ClipboardCheck}
      >
        <StatusToggle
          activeValue={viewMode}
          onToggle={setViewMode}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "History", value: "HISTORY" },
          ]}
        />

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branch_name}
            </option>
          ))}
        </select>

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search PO or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />
      </PageHeader>

      <DataTable
        headers={
          viewMode === "PENDING"
            ? [
                "PO Number",
                "Purchase Date",
                "Vendor",
                "Branch",
                "Total Amount",
                "Submitted By",
                "Status",
                "Actions",
              ]
            : [
                "PO Number",
                "Date Processed",
                "Vendor",
                "Branch",
                "Total Amount",
                "Decision By",
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
            : "Adjust your search parameters."
        }
        renderRow={(order) => (
          <tr
            key={order.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            {/* 1. PO Number */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase w-max">
                {order.purchase_order_number}
              </span>
            </td>

            {/* 2. Date */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {viewMode === "PENDING"
                  ? new Date(order.created_at).toLocaleDateString()
                  : new Date(order.processed_at).toLocaleString()}
              </p>
            </td>

            {/* 3. Vendor */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[150px]">
                {order.vendor_name}
              </p>
            </td>

            {/* 4. Branch */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {order.branch_name}
              </p>
            </td>

            {/* 5. Total Amount */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                ₱
                {parseFloat(order.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>

            {/* 6. User Accountability */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                {viewMode === "PENDING"
                  ? order.created_by_name
                  : order.resolved_by_name || order.created_by_name}
              </p>
            </td>

            {/* 7. Status */}
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={order.status.replace("_", " ")}
                variant={getBadgeVariant(order.status)}
              />
            </td>

            {/* 8. Actions */}
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedOrderId(order.id);
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onClear={clearFilters}
        onApply={applyFilters}
        title="Advanced Document Filters"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Filter by Vendor
            </label>
            <select
              value={tempVendorFilter}
              onChange={(e) => setTempVendorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterModal>

      <PurchaseOrderApprovalDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        poId={selectedOrderId}
        onSuccess={loadOrders}
      />
    </div>
  );
};

export default PurchaseOrderApprovals;
