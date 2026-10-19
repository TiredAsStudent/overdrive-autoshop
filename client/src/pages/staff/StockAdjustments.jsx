import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Scale,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Clock,
  FileSearch,
  Paperclip,
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

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const ITEMS_PER_PAGE = 10;

const StockAdjustments = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Synchronize statusFilter if URL query param changes
  useEffect(() => {
    const paramStatus = searchParams.get("status") || "all";
    setStatusFilter((prev) => {
      if (prev !== paramStatus) {
        setCurrentPage(1);
        return paramStatus;
      }
      return prev;
    });
  }, [searchParams]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockAdjustmentService.getRequests(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
      );

      const fetchedRequests = response.data || [];
      const fetchedTotalPages = response.pagination?.totalPages || 1;

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
  }, [currentPage, debouncedSearchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleModalSubmit = async (formData, evidenceFile) => {
    await stockAdjustmentService.createRequest(formData, evidenceFile);
    showToast("Adjustment request submitted successfully.", "success");
    setIsModalOpen(false);
    loadRequests();
  };

  const formatCalendarDate = (dateString) => {
    if (!dateString) return "N/A";
    const datePart = String(dateString).split("T")[0];
    const [year, month, day] = datePart.split("-");
    if (year && month && day) {
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Stock Adjustments"
        subtitle="Discrepancy Reporting Hub"
        icon={Scale}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter stock adjustments by approval status"
          options={STATUS_OPTIONS}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
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
        caption="Stock Adjustment and Variance Requests Directory"
        minWidth="min-w-[840px]"
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
        emptySubtitle="Try adjusting your search criteria or report a new stock variance."
        renderRow={(req) => {
          const docNumber =
            req.adjustment_number || `ADJ-${String(req.id).padStart(5, "0")}`;
          const isDeduct = req.adjustment_type === "DEDUCT";

          return (
            <tr
              key={req.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* ADJ Document */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                      {docNumber}
                    </span>
                    {req.evidence_url && (
                      <span
                        title="Photo Evidence Attached"
                        aria-label="Photo Evidence Attached"
                        className="inline-flex text-amber-500 dark:text-overdrive-yellow shrink-0"
                      >
                        <Paperclip size={13} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {formatCalendarDate(req.created_at)}
                  </span>
                </div>
              </td>

              {/* Item Profile */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div className="flex flex-col max-w-[200px] sm:max-w-[260px]">
                  <span
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate"
                    title={req.item_name}
                  >
                    {req.item_name}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {req.sku}
                  </span>
                </div>
              </td>

              {/* Requested Variance */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <div
                  className={`inline-flex items-center gap-1 text-xs sm:text-sm font-mono tabular-nums font-black ${
                    isDeduct
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isDeduct ? (
                    <ArrowDownRight size={16} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={16} aria-hidden="true" />
                  )}
                  <span>
                    {isDeduct ? "-" : "+"}
                    {req.requested_quantity}
                  </span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider opacity-80 ml-0.5">
                    {req.uom}
                  </span>
                </div>
              </td>

              {/* Reason Code */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10">
                  {req.reason ? req.reason.replace(/_/g, " ") : "UNSPECIFIED"}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={req.status || "PENDING"}
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

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(req);
                      setIsDrawerOpen(true);
                    }}
                    title={`View ${docNumber} Details`}
                    aria-label={`View details for ${docNumber}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
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
