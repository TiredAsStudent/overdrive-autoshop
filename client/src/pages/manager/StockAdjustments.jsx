import React, { useState, useEffect } from "react";
import {
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
import PageHeader from "../../components/shared/PageHeader";
import FilterModal from "../../components/shared/FilterModal";

import SearchBar from "../../components/ui/SearchBar";
import FilterButton from "../../components/ui/FilterButton";
import StatusToggle from "../../components/ui/StatusToggle";
import StatusBadge from "../../components/ui/StatusBadge";

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const activeFilterCount = branchFilter !== "all" ? 1 : 0;

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

  const resetFilters = () => {
    setBranchFilter("all");
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Adjustments"
        subtitle="Managerial Inbox & Resolution"
        icon={Scale}
      >
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search item or SKU..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <FilterButton
          onClick={() => setIsFilterModalOpen(true)}
          activeCount={activeFilterCount}
        />

        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={[
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />
      </PageHeader>

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
              <div className="flex flex-col items-start gap-1.5">
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${
                    req.adjustment_type === "ADD"
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  }`}
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
                    ? ShieldCheck
                    : req.status === "REJECTED"
                      ? XCircle
                      : Clock
                }
              />
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

      {/* UNIVERSAL FILTER MODAL */}
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
