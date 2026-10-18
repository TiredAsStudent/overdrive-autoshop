import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  FileSearch,
  ArrowRight,
  Edit2,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { estimateService } from "../../services/staff/estimate.service";
import EstimateModal from "../../features/staff/components/EstimateModal";
import EstimateDrawer from "../../features/staff/components/EstimateDrawer";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import PageHeader from "../../components/shared/PageHeader";

// Universal UI Components
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";

import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const ITEMS_PER_PAGE = 10;

const Estimates = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEditId, setLoadingEditId] = useState(null);

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
  const [estimateToEdit, setEstimateToEdit] = useState(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    onConfirm: () => {},
  });

  // Synchronize status filter if URL query param changes
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

  const loadEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await estimateService.getEstimates(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );

      const fetchedEstimates = response.data?.estimates || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedEstimates.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setEstimates(fetchedEstimates);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(error.message || "Unable to load estimate documents.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  const handleModalSubmit = async (formData) => {
    if (estimateToEdit) {
      await estimateService.updateEstimate(estimateToEdit.id, formData);
      showToast("Quotation Updated Successfully.", "success");
    } else {
      await estimateService.createEstimate(formData);
      showToast("Official Quotation Generated Successfully.", "success");
    }
    setIsModalOpen(false);
    setEstimateToEdit(null);
    loadEstimates();
  };

  const handleEditEstimate = async (estimateId) => {
    if (loadingEditId) return;
    setLoadingEditId(estimateId);
    try {
      const res = await estimateService.getEstimateDetails(estimateId);
      setEstimateToEdit(res.data);
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to load estimate details.", "error");
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleStatusChange = (estimate, newStatus) => {
    const isApproving = newStatus === "APPROVED";
    setConfirmConfig({
      isOpen: true,
      title: `${isApproving ? "Approve" : "Reject"} Estimate`,
      message: `Are you sure you want to mark ${estimate.estimate_number} as ${newStatus}? This action cannot be reversed.`,
      confirmText: `Yes, Mark ${newStatus}`,
      variant: isApproving ? "info" : "danger",
      onConfirm: async () => {
        try {
          await estimateService.updateStatus(estimate.id, newStatus);
          showToast(`Estimate ${newStatus} successfully.`, "success");
          loadEstimates();
        } catch (error) {
          showToast(
            error.message || "Failed to update estimate status.",
            "error",
          );
        }
      },
    });
  };

  const getStatusVariant = (status) => {
    if (status === "PENDING_APPROVAL") return "warning";
    if (status === "APPROVED" || status === "CONVERTED") return "success";
    if (status === "REJECTED" || status === "EXPIRED") return "danger";
    return "default"; // DRAFT
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return Clock;
      case "APPROVED":
        return CheckCircle;
      case "CONVERTED":
        return FileCheck;
      case "REJECTED":
        return XCircle;
      case "EXPIRED":
        return AlertCircle;
      default:
        return FileText; // DRAFT
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
        title="Estimates"
        subtitle="Pre-Sales Quotation Hub"
        icon={FileText}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter estimates by approval status"
          options={[
            { label: "All Records", value: "all" },
            { label: "Pending", value: "PENDING_APPROVAL" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search Document..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          onClick={() => {
            setEstimateToEdit(null);
            setIsModalOpen(true);
          }}
          label="Create Estimate"
          icon={Plus}
        />
      </PageHeader>

      {/* DATA TABLE */}
      <DataTable
        caption="Sales Estimates and Quotations Directory"
        minWidth="min-w-[820px]"
        headers={[
          "Document",
          "Client Link",
          "Date Details",
          "Grand Total",
          "Status",
          "Actions",
        ]}
        data={estimates}
        loading={loading}
        emptyTitle="No Estimate Documents Found"
        emptySubtitle="Try adjusting your search or filter criteria, or create a new estimate."
        renderRow={(estimate) => {
          const isFetchingEdit = loadingEditId === estimate.id;

          return (
            <tr
              key={estimate.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Document Number */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                  {estimate.estimate_number}
                </span>
              </td>

              {/* Client Link */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate max-w-[180px] sm:max-w-[240px]"
                  title={estimate.customer_name}
                >
                  {estimate.customer_name}
                </p>
              </td>

              {/* Date Details */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(estimate.created_at)}
                </p>
                <p className="text-[10px] font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mt-0.5">
                  Valid To: {formatDate(estimate.valid_until)}
                </p>
              </td>

              {/* Grand Total */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-mono tabular-nums font-black text-slate-900 dark:text-white">
                  ₱
                  {(parseFloat(estimate.grand_total) || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={
                    estimate.status
                      ? estimate.status.replace(/_/g, " ")
                      : "DRAFT"
                  }
                  variant={getStatusVariant(estimate.status)}
                  icon={getStatusIcon(estimate.status)}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEstimateId(estimate.id);
                      setIsDrawerOpen(true);
                    }}
                    title={`View ${estimate.estimate_number}`}
                    aria-label={`View estimate ${estimate.estimate_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
                  </button>

                  {(estimate.status === "PENDING_APPROVAL" ||
                    estimate.status === "DRAFT") && (
                    <button
                      type="button"
                      disabled={isFetchingEdit}
                      onClick={() => handleEditEstimate(estimate.id)}
                      title={`Edit ${estimate.estimate_number}`}
                      aria-label={`Edit estimate ${estimate.estimate_number}`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isFetchingEdit ? (
                        <Loader2
                          size={16}
                          aria-hidden="true"
                          className="animate-spin text-amber-500"
                        />
                      ) : (
                        <Edit2 size={16} aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {estimate.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/staff/sales/sales-orders", {
                          state: { estimateId: estimate.id },
                        })
                      }
                      title="Convert to Sales Order"
                      aria-label={`Convert ${estimate.estimate_number} to Sales Order`}
                      className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200/60 dark:hover:border-indigo-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}

                  {estimate.status === "PENDING_APPROVAL" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(estimate, "APPROVED")}
                        title={`Approve ${estimate.estimate_number}`}
                        aria-label={`Mark ${estimate.estimate_number} as Approved`}
                        className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(estimate, "REJECTED")}
                        title={`Reject ${estimate.estimate_number}`}
                        aria-label={`Mark ${estimate.estimate_number} as Rejected`}
                        className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200/60 dark:hover:border-rose-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <XCircle size={16} aria-hidden="true" />
                      </button>
                    </>
                  )}
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

      {/* Modals & Drawers */}
      <EstimateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEstimateToEdit(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={estimateToEdit}
      />
      <EstimateDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        estimateId={selectedEstimateId}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default Estimates;
