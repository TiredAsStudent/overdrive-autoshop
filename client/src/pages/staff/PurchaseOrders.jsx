import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  ShoppingCart,
  Plus,
  FileSearch,
  Edit2,
  Send,
  XCircle,
  FileText,
  CheckCircle,
  Clock,
  FileCheck,
} from "lucide-react";
import { purchaseOrderService } from "../../services/staff/purchaseOrder.service";
import PurchaseOrderModal from "../../features/staff/components/PurchaseOrderModal";
import PurchaseOrderDrawer from "../../features/staff/components/PurchaseOrderDrawer";

// --- REUSABLE SHARED COMPONENTS ---
import PageHeader from "../../components/shared/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import StatusToggle from "../../components/ui/StatusToggle";
import ActionButton from "../../components/ui/ActionButton";
import StatusBadge from "../../components/ui/StatusBadge";
import DataTable from "../../components/shared/DataTable";
import Pagination from "../../components/shared/Pagination";
import ConfirmModal from "../../components/shared/ConfirmModal";
import { useApp } from "../../context/AppContext";
import { useDebounce } from "../../hooks/useDebounce";

const STATUS_FILTERS = [
  { label: "All POs", value: "all" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Pending", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const ITEMS_PER_PAGE = 10;

const PurchaseOrders = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingRow, setIsEditingRow] = useState(null);

  // Base Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPoId, setSelectedPoId] = useState(null);
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await purchaseOrderService.getPurchaseOrders(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearchQuery,
        statusFilter,
      );

      const fetchedOrders = response.data?.purchaseOrders || [];
      const fetchedTotalPages = response.data?.pagination?.totalPages || 1;

      if (fetchedOrders.length === 0 && currentPage > fetchedTotalPages) {
        setCurrentPage(Math.max(1, fetchedTotalPages));
        return;
      }

      setOrders(fetchedOrders);
      setTotalPages(fetchedTotalPages);
    } catch (error) {
      showToast(
        error.message || "Unable to load purchase order records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleEditClick = async (orderId) => {
    if (isEditingRow) return;
    try {
      setIsEditingRow(orderId);
      const res = await purchaseOrderService.getPurchaseOrderDetails(orderId);
      setSelectedOrder(res.data);
      setIsModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to load details.", "error");
    } finally {
      setIsEditingRow(null);
    }
  };

  const handleModalSubmit = async (formData) => {
    if (selectedOrder) {
      await purchaseOrderService.updatePurchaseOrder(
        selectedOrder.id,
        formData,
      );
      showToast(
        formData.is_submitting
          ? "Document submitted for managerial approval."
          : "Draft saved successfully.",
        "success",
      );
    } else {
      await purchaseOrderService.createPurchaseOrder(formData);
      showToast(
        formData.is_submitting
          ? "Purchase Order generated and submitted for approval."
          : "New Purchase Order drafted.",
        "success",
      );
    }
    setIsModalOpen(false);
    setSelectedOrder(null);
    loadOrders();
  };

  const handleStatusChange = (order, newStatus) => {
    const isSubmit = newStatus === "PENDING_APPROVAL";
    setConfirmConfig({
      isOpen: true,
      title: isSubmit ? "Submit for Approval" : "Cancel Order",
      message: `Are you sure you want to ${isSubmit ? "submit" : "cancel"} ${order.purchase_order_number}? ${isSubmit ? "It will be locked for review." : "This action is permanent."}`,
      confirmText: `Yes, ${isSubmit ? "Submit" : "Cancel"}`,
      variant: isSubmit ? "info" : "danger",
      onConfirm: async () => {
        try {
          await purchaseOrderService.updateStatus(order.id, newStatus);
          showToast(
            `Document successfully ${isSubmit ? "submitted" : "cancelled"}.`,
            "success",
          );
          loadOrders();
        } catch (error) {
          showToast(
            error.message || "Failed to update purchase order status.",
            "error",
          );
        }
      },
    });
  };

  const getBadgeDetails = (status) => {
    switch (status) {
      case "APPROVED":
        return { variant: "success", icon: CheckCircle };
      case "PENDING_APPROVAL":
        return { variant: "warning", icon: Clock };
      case "REJECTED":
      case "CANCELLED":
        return { variant: "danger", icon: XCircle };
      case "CLOSED":
        return { variant: "info", icon: FileCheck };
      default:
        return { variant: "default", icon: FileText };
    }
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

  const formatCurrency = (val) => {
    return (parseFloat(val) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative pb-10 w-full">
      <PageHeader
        title="Purchase Orders"
        subtitle="Procurement Control"
        icon={ShoppingCart}
      >
        <StatusToggle
          activeValue={statusFilter}
          onToggle={handleStatusFilterChange}
          ariaLabel="Filter purchase orders by status"
          options={STATUS_FILTERS}
        />

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search PO or Vendor..."
          isSearching={searchQuery !== debouncedSearchQuery}
        />

        <ActionButton
          onClick={() => {
            setSelectedOrder(null);
            setIsModalOpen(true);
          }}
          label="Draft Document"
          icon={Plus}
        />
      </PageHeader>

      <DataTable
        caption="Purchase Orders and Procurement Directory"
        minWidth="min-w-[840px]"
        headers={[
          "Document Ref",
          "Vendor",
          "Date Details",
          "Grand Total",
          "Status",
          "Actions",
        ]}
        data={orders}
        loading={loading}
        emptyTitle="No Purchase Orders Found"
        emptySubtitle="Try adjusting your search or filter criteria, or draft a new purchase order."
        renderRow={(order) => {
          const badge = getBadgeDetails(order.status);
          return (
            <tr
              key={order.id}
              className="group table-row-hover border-b border-slate-100 dark:border-white/5 last:border-0"
            >
              {/* Document Ref */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900/70 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-mono tabular-nums font-black tracking-widest uppercase">
                  {order.purchase_order_number}
                </span>
              </td>

              {/* Vendor */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p
                  className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate max-w-[180px] sm:max-w-[240px]"
                  title={order.vendor_name}
                >
                  {order.vendor_name}
                </p>
              </td>

              {/* Date Details */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <p className="text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                  {formatCalendarDate(order.created_at)}
                </p>
                <p className="text-[10px] font-mono tabular-nums font-bold text-amber-600 dark:text-overdrive-yellow uppercase tracking-widest mt-0.5">
                  Delivery:{" "}
                  {order.expected_delivery_date
                    ? formatCalendarDate(order.expected_delivery_date)
                    : "Not Set"}
                </p>
              </td>

              {/* Grand Total */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                  ₱{formatCurrency(order.grand_total)}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 whitespace-nowrap">
                <StatusBadge
                  label={
                    order.status ? order.status.replace(/_/g, " ") : "DRAFT"
                  }
                  variant={badge.variant}
                  icon={badge.icon}
                />
              </td>

              {/* Actions */}
              <td className="px-4 sm:px-8 py-4 sm:py-5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPoId(order.id);
                      setIsDrawerOpen(true);
                    }}
                    title={`View ${order.purchase_order_number}`}
                    aria-label={`View purchase order ${order.purchase_order_number}`}
                    className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/60 dark:hover:border-blue-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSearch size={16} aria-hidden="true" />
                  </button>

                  {/* Draft / Rejected Records allow Editing & Submission */}
                  {["DRAFT", "REJECTED"].includes(order.status) && (
                    <>
                      <button
                        type="button"
                        disabled={isEditingRow === order.id}
                        onClick={() => handleEditClick(order.id)}
                        title={`Edit ${order.purchase_order_number}`}
                        aria-label={`Edit purchase order ${order.purchase_order_number}`}
                        className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-amber-600 dark:hover:text-overdrive-yellow hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200/60 dark:hover:border-amber-500/20 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isEditingRow === order.id ? (
                          <Loader2
                            size={16}
                            aria-hidden="true"
                            className="animate-spin text-amber-500"
                          />
                        ) : (
                          <Edit2 size={16} aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(order, "PENDING_APPROVAL")
                        }
                        title={`Submit ${order.purchase_order_number} for Approval`}
                        aria-label={`Submit ${order.purchase_order_number} for approval`}
                        className="p-2 sm:p-2.5 text-slate-400 border border-transparent hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <Send size={16} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(order, "CANCELLED")}
                        title={`Cancel ${order.purchase_order_number}`}
                        aria-label={`Cancel purchase order ${order.purchase_order_number}`}
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

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={selectedOrder}
      />
      <PurchaseOrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        poId={selectedPoId}
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

export default PurchaseOrders;
