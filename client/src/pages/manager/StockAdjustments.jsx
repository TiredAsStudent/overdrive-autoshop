import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Scale,
  Clock,
  ShieldCheck,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react";
import { stockAdjustmentService } from "../../services/manager/stockAdjustment.service";
import { inventoryService } from "../../services/manager/inventory.service";
import AdjustmentModal from "../../features/manager/components/AdjustmentModal";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const StockAdjustments = () => {
  const { showToast } = useApp();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    inventoryService
      .getActiveBranches()
      .then((res) => setBranches(res.data || []))
      .catch((err) => console.error("Failed to load branches", err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, branchFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await stockAdjustmentService.getRequests(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        branchFilter,
      );
      setRequests(response.data?.requests || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentPage, debouncedSearchQuery, statusFilter, branchFilter]);

  const handleResolution = async (id, action, remarks) => {
    try {
      if (action === "APPROVE") {
        const res = await stockAdjustmentService.approveRequest(id, remarks);
        showToast(res.message, "success");
      } else {
        const res = await stockAdjustmentService.rejectRequest(id, remarks);
        showToast(res.message, "info");
      }
      setIsModalOpen(false);
      loadRequests();
    } catch (error) {
      throw error;
    }
  };

  const renderStatusBadge = (status) => {
    if (status === "PENDING")
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-500/20">
          <Clock size={12} /> Pending
        </span>
      );
    if (status === "APPROVED")
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
          <ShieldCheck size={12} /> Approved
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-200 dark:border-red-500/20">
        <XCircle size={12} /> Rejected
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl shrink-0">
            <Scale className="text-amber-600 dark:text-overdrive-yellow h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic truncate">
              Stock Adjustments
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">
              Managerial Inbox & Resolution
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-[250px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {searchQuery !== debouncedSearchQuery ? (
                <Loader2 size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Search size={16} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search item or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

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

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
            {["PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === status ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
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
        renderRow={(req) => (
          <tr
            key={req.id}
            className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="min-w-0 max-w-[200px] sm:max-w-[300px]">
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic uppercase truncate">
                  {req.item_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    {req.sku}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[9px] font-medium text-slate-400">
                    By {req.requester_first_name} {req.requester_last_name}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                {req.branch_name}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <div className="flex flex-col items-start gap-1">
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${req.adjustment_type === "ADD" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"}`}
                >
                  {req.adjustment_type === "ADD" ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {req.requested_quantity} {req.uom}
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                  {req.reason.replace(/_/g, " ")}
                </span>
              </div>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              {renderStatusBadge(req.status)}
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <button
                onClick={() => {
                  setSelectedRequest(req);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm shadow-amber-500/20"
              >
                <Eye size={14} />{" "}
                {statusFilter === "PENDING" ? "Review Request" : "View Details"}
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

      <AdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleResolution}
        request={selectedRequest}
      />
    </div>
  );
};

export default StockAdjustments;
