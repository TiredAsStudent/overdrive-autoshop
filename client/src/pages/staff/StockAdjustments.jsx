import React, { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { stockAdjustmentService } from "../../services/staff/stockAdjustment.service";
import StockAdjustmentModal from "../../features/staff/components/StockAdjustmentModal";
import StockAdjustmentDrawer from "../../features/staff/components/StockAdjustmentDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import PageHeader from "../../components/shared/PageHeader";

import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Adjustments"
        subtitle="Discrepancy Reporting Hub"
        icon={Scale}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={[
            { label: "All", value: "all" },
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ADJ or Item..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          onClick={() => setIsModalOpen(true)}
          label="Report Variance"
          icon={Plus}
        />
      </PageHeader>

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
        emptySubtitle="Try adjusting your search criteria or report a new variance."
        renderRow={(req) => (
          <tr
            key={req.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {req.adjustment_number ||
                    `ADJ-${String(req.id).padStart(5, "0")}`}
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
                className={`flex items-center gap-1.5 text-xs font-black ${
                  req.adjustment_type === "DEDUCT"
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
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

            <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsDrawerOpen(true);
                  }}
                  title="View Details"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <Eye size={16} /> Details
                </button>
              </div>
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
