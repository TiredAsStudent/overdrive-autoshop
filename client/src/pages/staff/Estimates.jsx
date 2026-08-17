import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  FileSearch,
  ArrowRight,
  Edit2,
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

const Estimates = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [estimates, setEstimates] = useState([]);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const response = await estimateService.getEstimates(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
        "all",
      );
      setEstimates(response.data?.estimates || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimates();
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  const handleModalSubmit = async (formData) => {
    try {
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
    } catch (error) {
      throw error;
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
          showToast(error.message, "error");
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-700 relative pb-10 w-full">
      {/* UNIVERSAL PAGE HEADER */}
      <PageHeader
        title="Estimates"
        subtitle="Pre-Sales Quotation Hub"
        icon={FileText}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={setStatusFilter}
          options={[
            { label: "All Records", value: "all" },
            { label: "Pending", value: "PENDING_APPROVAL" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        renderRow={(estimate) => (
          <tr
            key={estimate.id}
            className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-black tracking-widest uppercase">
                {estimate.estimate_number}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">
                {estimate.customer_name}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {new Date(estimate.created_at).toLocaleDateString()}
              </p>
              <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">
                Valid To: {new Date(estimate.valid_until).toLocaleDateString()}
              </p>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₱
                {parseFloat(estimate.grand_total).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6">
              <StatusBadge
                label={estimate.status.replace("_", " ")}
                variant={getStatusVariant(estimate.status)}
              />
            </td>
            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
              <div className="flex items-center justify-end gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setSelectedEstimateId(estimate.id);
                    setIsDrawerOpen(true);
                  }}
                  title="View Document"
                  className="p-1.5 sm:p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <FileSearch size={16} />
                </button>

                {(estimate.status === "PENDING_APPROVAL" ||
                  estimate.status === "DRAFT") && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await estimateService.getEstimateDetails(
                          estimate.id,
                        );
                        setEstimateToEdit(res.data);
                        setIsModalOpen(true);
                      } catch (err) {
                        showToast(
                          err.message || "Failed to load estimate details.",
                          "error",
                        );
                      }
                    }}
                    title="Edit Document"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                )}

                {estimate.status === "APPROVED" && (
                  <button
                    onClick={() =>
                      navigate("/staff/sales/sales-orders", {
                        state: { estimateId: estimate.id },
                      })
                    }
                    title="Convert to Sales Order"
                    className="p-1.5 sm:p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowRight size={16} />
                  </button>
                )}

                {estimate.status === "PENDING_APPROVAL" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(estimate, "APPROVED")}
                      title="Mark Approved"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(estimate, "REJECTED")}
                      title="Mark Rejected"
                      className="p-1.5 sm:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
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

      {/* Modals & Drawers */}
      <EstimateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
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
