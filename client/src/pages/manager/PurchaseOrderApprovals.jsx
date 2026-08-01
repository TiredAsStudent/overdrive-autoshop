import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ClipboardCheck,
  FileSearch,
  Archive,
} from "lucide-react";
import { poApprovalService } from "../../services/manager/poApproval.service";
import { inventoryService } from "../../services/manager/inventory.service";
import PurchaseOrderApprovalDrawer from "../../features/manager/components/POApprovalDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const PurchaseOrderApprovals = () => {
  const { showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
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

  // Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, viewMode, branchFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res =
        viewMode === "PENDING"
          ? await poApprovalService.getPendingApprovals(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              "all",
              branchFilter,
            )
          : await poApprovalService.getApprovalHistory(
              currentPage,
              ITEMS_PER_PAGE,
              debouncedSearchQuery,
              "all",
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
  }, [currentPage, debouncedSearchQuery, viewMode, branchFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "REJECTED":
        return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-indigo-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <ClipboardCheck className="text-indigo-600 dark:text-indigo-400 h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              PO Approvals
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Managerial Procurement Oversight
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Tab Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setViewMode("PENDING")}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "PENDING"
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <ClipboardCheck size={14} /> Pending Queue
            </button>
            <button
              onClick={() => setViewMode("HISTORY")}
              className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "HISTORY"
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Archive size={14} /> Audit History
            </button>
          </div>

          {/* Branch Filter Dropdown */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branch_name}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-[200px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-indigo-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search PO or Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "Document Ref",
          "Supplier Detail",
          viewMode === "PENDING" ? "Expected Delivery" : "Processed At",
          "Grand Total",
          "Status",
          "Actions",
        ]}
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
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col gap-1 text-left">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase w-max">
                  {order.purchase_order_number}
                </span>
                <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                  By: {order.created_by_name}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {order.vendor_name}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                {order.branch_name}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {viewMode === "PENDING"
                  ? new Date(order.expected_delivery_date).toLocaleDateString()
                  : new Date(order.processed_at).toLocaleString()}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₱
                {parseFloat(order.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(order.status)}`}
              >
                {order.status.replace("_", " ")}
              </span>
            </td>
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
                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
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
