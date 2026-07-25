import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Scale,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Network,
} from "lucide-react";
import { stockAdjustmentService } from "../../services/staff/stockAdjustment.service";
import StockAdjustmentModal from "../../features/staff/components/StockAdjustmentModal";
import StockAdjustmentDrawer from "../../features/staff/components/StockAdjustmentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { id: "all", label: "All Requests" },
  { id: "PENDING", label: "Pending Review" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

const StockAdjustments = () => {
  const { showToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await stockAdjustmentService.getRequests(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
      );
      setRequests(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
      await stockAdjustmentService.createRequest(formData);
      showToast("Adjustment request submitted successfully.", "success");
      setIsModalOpen(false);
      loadRequests();
    } catch (error) {
      throw error; // Let modal catch and show validation errors
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "REJECTED":
        return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      default:
        return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20";
    }
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
              Discrepancy Reporting Hub
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
            {STATUS_FILTERS.map((f) => (
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
              placeholder="Search ADJ or Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Report Variance
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        headers={[
          "ADJ Document",
          "Item Profile",
          "Requested Variance",
          "Reason Code",
          "Status",
          "Actions",
        ]}
        data={requests}
        loading={loading}
        emptyTitle="No Discrepancies Found"
        renderRow={(req) => (
          <tr
            key={req.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {req.adjustment_number || `ADJ-LEGACY-${req.id}`}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col max-w-[200px]">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">
                  {req.item_name}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {req.sku}
                </span>
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div
                className={`flex items-center gap-1.5 text-xs font-black ${req.adjustment_type === "DEDUCT" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
              >
                {req.adjustment_type === "DEDUCT" ? (
                  <ArrowDownRight size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
                {req.requested_quantity} {req.uom}
              </div>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                {req.reason.replace(/_/g, " ")}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusBadge(req.status)}`}
              >
                {req.status === "APPROVED" ? (
                  <CheckCircle size={10} />
                ) : req.status === "REJECTED" ? (
                  <XCircle size={10} />
                ) : (
                  <Clock size={10} />
                )}
                {req.status}
              </span>
            </td>

            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <button
                onClick={() => {
                  setSelectedRequest(req);
                  setIsDrawerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
              >
                <Network size={14} /> Details
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

      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <StockAdjustmentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
};

export default StockAdjustments;
